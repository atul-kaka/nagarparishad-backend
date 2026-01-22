const pool = require('../config/database');

class School {
  static async create(schoolData) {
    // Validate that at least one identifier field is provided
    const hasIdentifier = 
      (schoolData.school_recognition_no && String(schoolData.school_recognition_no).trim() !== '') ||
      (schoolData.general_register_no && String(schoolData.general_register_no).trim() !== '') ||
      (schoolData.affiliation_no && String(schoolData.affiliation_no).trim() !== '');

    if (!hasIdentifier) {
      const error = new Error('At least one identifier is required');
      error.validationErrors = [{
        field: 'identifier',
        message: 'At least one of school_recognition_no, general_register_no, or affiliation_no must be provided'
      }];
      throw error;
    }

    // Check for duplicates before inserting
    const duplicateErrors = await this.checkForDuplicates(schoolData);
    if (duplicateErrors.length > 0) {
      const error = new Error('Duplicate record found');
      error.duplicateErrors = duplicateErrors;
      throw error;
    }

    const {
      name, address, taluka, district, state, phone_no, email,
      general_register_no, school_recognition_no, udise_no,
      affiliation_no, board, medium
    } = schoolData;

    try {
      const query = `
        INSERT INTO schools (
          name, address, taluka, district, state, phone_no, email,
          general_register_no, school_recognition_no, udise_no,
          affiliation_no, board, medium
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const values = [
        name, address, taluka, district, state, phone_no, email,
        general_register_no, school_recognition_no, udise_no,
        affiliation_no, board || 'Maharashtra State', medium || 'Marathi'
      ];

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      // Handle database unique constraint violations
      if (error.code === '23505') { // Unique violation
        const duplicateError = new Error('Duplicate record found');
        
        // Parse the error message to determine which field
        if (error.constraint && error.constraint.includes('recognition')) {
          duplicateError.duplicateErrors = [{
            field: 'school_recognition_no',
            message: 'School recognition number already exists'
          }];
        } else if (error.constraint && error.constraint.includes('general_register')) {
          duplicateError.duplicateErrors = [{
            field: 'general_register_no',
            message: 'General register number already exists'
          }];
        } else if (error.constraint && error.constraint.includes('affiliation')) {
          duplicateError.duplicateErrors = [{
            field: 'affiliation_no',
            message: 'Affiliation number already exists'
          }];
        } else {
          duplicateError.duplicateErrors = [{
            field: 'unknown',
            message: 'A duplicate record already exists'
          }];
        }
        
        throw duplicateError;
      }
      throw error;
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM schools WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findAll() {
    const query = 'SELECT * FROM schools ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByRecognitionNo(recognitionNo) {
    const query = 'SELECT * FROM schools WHERE school_recognition_no = $1';
    const result = await pool.query(query, [recognitionNo]);
    return result.rows[0];
  }

  static async findByGeneralRegisterNo(generalRegisterNo) {
    const query = 'SELECT * FROM schools WHERE general_register_no = $1';
    const result = await pool.query(query, [generalRegisterNo]);
    return result.rows[0];
  }

  static async findByAffiliationNo(affiliationNo) {
    const query = 'SELECT * FROM schools WHERE affiliation_no = $1';
    const result = await pool.query(query, [affiliationNo]);
    return result.rows[0];
  }

  static async checkForDuplicates(schoolData, excludeId = null) {
    const errors = [];

    // Check school_recognition_no (only if provided and not empty)
    if (schoolData.school_recognition_no && String(schoolData.school_recognition_no).trim() !== '') {
      const trimmedValue = String(schoolData.school_recognition_no).trim();
      const existing = await pool.query(
        'SELECT id FROM schools WHERE school_recognition_no = $1 AND school_recognition_no IS NOT NULL AND school_recognition_no != \'\'' + 
        (excludeId ? ' AND id != $2' : ''),
        excludeId ? [trimmedValue, excludeId] : [trimmedValue]
      );
      if (existing.rows.length > 0) {
        errors.push({
          field: 'school_recognition_no',
          value: schoolData.school_recognition_no,
          message: 'School recognition number already exists'
        });
      }
    }

    // Check general_register_no (only if provided and not empty)
    if (schoolData.general_register_no && String(schoolData.general_register_no).trim() !== '') {
      const trimmedValue = String(schoolData.general_register_no).trim();
      const existing = await pool.query(
        'SELECT id FROM schools WHERE general_register_no = $1 AND general_register_no IS NOT NULL AND general_register_no != \'\'' + 
        (excludeId ? ' AND id != $2' : ''),
        excludeId ? [trimmedValue, excludeId] : [trimmedValue]
      );
      if (existing.rows.length > 0) {
        errors.push({
          field: 'general_register_no',
          value: schoolData.general_register_no,
          message: 'General register number already exists'
        });
      }
    }

    // Check affiliation_no (only if provided and not empty)
    if (schoolData.affiliation_no && String(schoolData.affiliation_no).trim() !== '') {
      const trimmedValue = String(schoolData.affiliation_no).trim();
      const existing = await pool.query(
        'SELECT id FROM schools WHERE affiliation_no = $1 AND affiliation_no IS NOT NULL AND affiliation_no != \'\'' + 
        (excludeId ? ' AND id != $2' : ''),
        excludeId ? [trimmedValue, excludeId] : [trimmedValue]
      );
      if (existing.rows.length > 0) {
        errors.push({
          field: 'affiliation_no',
          value: schoolData.affiliation_no,
          message: 'Affiliation number already exists'
        });
      }
    }

    return errors;
  }

  static async update(id, schoolData) {
    // Get existing school to check if we're removing all identifiers
    const existingSchool = await this.findById(id);
    if (!existingSchool) {
      return null;
    }

    // Check if update would remove all identifiers
    const existingHasIdentifier = 
      (existingSchool.school_recognition_no && String(existingSchool.school_recognition_no).trim() !== '') ||
      (existingSchool.general_register_no && String(existingSchool.general_register_no).trim() !== '') ||
      (existingSchool.affiliation_no && String(existingSchool.affiliation_no).trim() !== '');

    const updatedSchoolData = { ...existingSchool, ...schoolData };
    const updatedHasIdentifier = 
      (updatedSchoolData.school_recognition_no && String(updatedSchoolData.school_recognition_no).trim() !== '') ||
      (updatedSchoolData.general_register_no && String(updatedSchoolData.general_register_no).trim() !== '') ||
      (updatedSchoolData.affiliation_no && String(updatedSchoolData.affiliation_no).trim() !== '');

    // If we had an identifier before, and update would remove all, validate
    if (existingHasIdentifier && !updatedHasIdentifier) {
      const error = new Error('At least one identifier is required');
      error.validationErrors = [{
        field: 'identifier',
        message: 'At least one of school_recognition_no, general_register_no, or affiliation_no must be provided'
      }];
      throw error;
    }

    // Check for duplicates before updating (exclude current record)
    const duplicateErrors = await this.checkForDuplicates(schoolData, id);
    if (duplicateErrors.length > 0) {
      const error = new Error('Duplicate record found');
      error.duplicateErrors = duplicateErrors;
      throw error;
    }

    const fields = Object.keys(schoolData);
    const values = Object.values(schoolData);
    values.push(id);

    try {
      const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const query = `
        UPDATE schools 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${fields.length + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0];
    } catch (error) {
      // Handle database unique constraint violations
      if (error.code === '23505') { // Unique violation
        const duplicateError = new Error('Duplicate record found');
        
        // Parse the error message to determine which field
        if (error.constraint && error.constraint.includes('recognition')) {
          duplicateError.duplicateErrors = [{
            field: 'school_recognition_no',
            message: 'School recognition number already exists'
          }];
        } else if (error.constraint && error.constraint.includes('general_register')) {
          duplicateError.duplicateErrors = [{
            field: 'general_register_no',
            message: 'General register number already exists'
          }];
        } else if (error.constraint && error.constraint.includes('affiliation')) {
          duplicateError.duplicateErrors = [{
            field: 'affiliation_no',
            message: 'Affiliation number already exists'
          }];
        } else {
          duplicateError.duplicateErrors = [{
            field: 'unknown',
            message: 'A duplicate record already exists'
          }];
        }
        
        throw duplicateError;
      }
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM schools WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = School;

