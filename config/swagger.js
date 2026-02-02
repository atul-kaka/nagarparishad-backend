const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nagar Parishad School Leaving Certificate API',
      version: '1.0.0',
      description: 'RESTful API for managing Nagar Parishad School Leaving Certificates with audit trail support',
      contact: {
        name: 'API Support',
        email: 'support@nagarparishad.gov.in'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.kaamlo.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        School: {
          type: 'object',
          required: ['name', 'district'],
          properties: {
            id: {
              type: 'integer',
              description: 'School ID'
            },
            name: {
              type: 'string',
              description: 'School name',
              example: 'स्व. जतिरामजी बर्वे नगर परिषद प्राथमिक शाळा, रामटेक'
            },
            address: {
              type: 'string',
              description: 'School address'
            },
            taluka: {
              type: 'string',
              example: 'रामटेक'
            },
            district: {
              type: 'string',
              example: 'नागपूर'
            },
            state: {
              type: 'string',
              example: 'महाराष्ट्र'
            },
            phone_no: {
              type: 'string',
              example: '07112234567'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            general_register_no: {
              type: 'string',
              example: 'GR001'
            },
            school_recognition_no: {
              type: 'string'
            },
            udise_no: {
              type: 'string'
            },
            affiliation_no: {
              type: 'string'
            },
            board: {
              type: 'string',
              default: 'Maharashtra State'
            },
            medium: {
              type: 'string',
              default: 'Marathi'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              default: 'active'
            },
            created_by: {
              type: 'integer',
              description: 'User ID who created the record'
            },
            updated_by: {
              type: 'integer',
              description: 'User ID who last updated the record'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Student: {
          type: 'object',
          required: ['full_name', 'date_of_birth'],
          properties: {
            id: {
              type: 'integer'
            },
            student_id: {
              type: 'string',
              example: 'STU001'
            },
            uid_aadhar_no: {
              type: 'string',
              pattern: '^[0-9]{12}$',
              description: '12-digit Aadhar number',
              example: '123456789012'
            },
            full_name: {
              type: 'string',
              example: 'राजेश कुमार'
            },
            father_name: {
              type: 'string',
              example: 'राम कुमार'
            },
            mother_name: {
              type: 'string',
              example: 'गीता देवी'
            },
            surname: {
              type: 'string',
              example: 'शर्मा'
            },
            nationality: {
              type: 'string',
              example: 'Indian'
            },
            mother_tongue: {
              type: 'string',
              example: 'Marathi'
            },
            religion: {
              type: 'string'
            },
            caste: {
              type: 'string'
            },
            sub_caste: {
              type: 'string'
            },
            birth_place_village: {
              type: 'string',
              example: 'रामटेक'
            },
            birth_place_taluka: {
              type: 'string'
            },
            birth_place_district: {
              type: 'string',
              example: 'नागपूर'
            },
            birth_place_state: {
              type: 'string',
              example: 'महाराष्ट्र'
            },
            birth_place_country: {
              type: 'string',
              default: 'India'
            },
            date_of_birth: {
              type: 'string',
              format: 'date',
              example: '2010-05-15'
            },
            date_of_birth_words: {
              type: 'string',
              example: 'पंधरा मे दोन हजार दहा'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'archived'],
              default: 'active'
            },
            created_by: {
              type: 'integer'
            },
            updated_by: {
              type: 'integer'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LeavingCertificate: {
          type: 'object',
          required: ['school_id', 'student_id', 'serial_no', 'leaving_date', 'leaving_class'],
          properties: {
            id: {
              type: 'integer'
            },
            school_id: {
              type: 'integer',
              description: 'Reference to schools table'
            },
            student_id: {
              type: 'integer',
              description: 'Reference to students table'
            },
            serial_no: {
              type: 'string',
              example: '101'
            },
            previous_school: {
              type: 'string'
            },
            previous_class: {
              type: 'string'
            },
            admission_date: {
              type: 'string',
              format: 'date',
              example: '2019-06-01'
            },
            admission_class: {
              type: 'string',
              example: 'Class 1'
            },
            progress_in_studies: {
              type: 'string',
              example: 'Good'
            },
            conduct: {
              type: 'string',
              example: 'Excellent'
            },
            leaving_date: {
              type: 'string',
              format: 'date',
              example: '2024-03-31'
            },
            leaving_class: {
              type: 'string',
              example: 'Class 5'
            },
            studying_class_and_since: {
              type: 'string',
              example: 'Class 5 since June 2023'
            },
            reason_for_leaving: {
              type: 'string',
              example: 'Transfer to another school'
            },
            remarks: {
              type: 'string'
            },
            school_general_register_no: {
              type: 'string',
              example: 'GR001',
              description: 'Reference to the school\'s general register number'
            },
            certificate_date: {
              type: 'string',
              format: 'date',
              example: '2024-04-01'
            },
            certificate_month: {
              type: 'string',
              example: 'April'
            },
            certificate_year: {
              type: 'integer',
              example: 2024
            },
            class_teacher_name: {
              type: 'string',
              example: 'श्रीमती सुनीता पाटिल'
            },
            clerk_name: {
              type: 'string',
              example: 'श्री रवींद्र जोशी'
            },
            headmaster_name: {
              type: 'string',
              example: 'श्री महेश देशमुख'
            },
            status: {
              type: 'string',
              enum: ['draft', 'issued', 'archived', 'cancelled'],
              default: 'draft'
            },
            created_by: {
              type: 'integer'
            },
            updated_by: {
              type: 'integer'
            },
            issued_by: {
              type: 'integer',
              description: 'User ID who issued the certificate'
            },
            issued_at: {
              type: 'string',
              format: 'date-time'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'full_name'],
          properties: {
            id: {
              type: 'integer'
            },
            username: {
              type: 'string',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              writeOnly: true
            },
            full_name: {
              type: 'string',
              example: 'John Doe'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'clerk', 'headmaster'],
              default: 'user'
            },
            phone_no: {
              type: 'string'
            },
            is_active: {
              type: 'boolean',
              default: true
            },
            last_login: {
              type: 'string',
              format: 'date-time'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            },
            updated_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            table_name: {
              type: 'string',
              example: 'leaving_certificates'
            },
            record_id: {
              type: 'integer'
            },
            action: {
              type: 'string',
              enum: ['INSERT', 'UPDATE', 'DELETE']
            },
            field_name: {
              type: 'string'
            },
            old_value: {
              type: 'string'
            },
            new_value: {
              type: 'string'
            },
            changed_by: {
              type: 'integer'
            },
            changed_by_username: {
              type: 'string'
            },
            changed_by_name: {
              type: 'string'
            },
            changed_at: {
              type: 'string',
              format: 'date-time'
            },
            ip_address: {
              type: 'string'
            },
            user_agent: {
              type: 'string'
            },
            notes: {
              type: 'string'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object'
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            },
            message: {
              type: 'string'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Resource not found'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                errors: [
                  {
                    msg: 'Field is required',
                    param: 'field_name'
                  }
                ]
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: 'Internal server error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Schools',
        description: 'School management endpoints'
      },
      {
        name: 'Students',
        description: 'Student management endpoints'
      },
      {
        name: 'Certificates',
        description: 'Leaving certificate management endpoints'
      },
      {
        name: 'Users',
        description: 'User registration and management'
      },
      {
        name: 'Audit',
        description: 'Audit trail and logging endpoints'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'] // Path to the API files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;




