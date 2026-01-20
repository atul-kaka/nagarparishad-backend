# Complete WinACME Certificate Generation

Your certificate generation stopped at the DNS validation step. You need to complete the process.

---

## Step 1: Add DNS TXT Record

WinACME showed you this DNS record to add:

```
Domain:              api.kaamlo.com
Record:              _acme-challenge.api.kaamlo.com
Type:                TXT
Content:             "KjN-QGiBvzAIiUs0jLQljTIAgyhOpcYr_Xh1KWDkDkE"
```

### Add the Record:

1. **Log into your domain registrar** (where you manage kaamlo.com DNS)
2. **Go to DNS Management**
3. **Add a TXT Record:**
   - **Name/Host:** `_acme-challenge.api`
   - **Type:** `TXT`
   - **Value/Content:** `KjN-QGiBvzAIiUs0jLQljTIAgyhOpcYr_Xh1KWDkDkE`
   - **TTL:** 300 (or default)

**Note:** Some DNS providers automatically add quotes. If they do, you might see:
```
"KjN-QGiBvzAIiUs0jLQljTIAgyhOpcYr_Xh1KWDkDkE"
```
That's fine - the quotes are just for display.

### Verify DNS Record:

Wait 1-5 minutes, then verify the record exists:

```powershell
# PowerShell
Resolve-DnsName -Name _acme-challenge.api.kaamlo.com -Type TXT

# Or using nslookup
nslookup -type=TXT _acme-challenge.api.kaamlo.com
```

You should see the value: `KjN-QGiBvzAIiUs0jLQljTIAgyhOpcYr_Xh1KWDkDkE`

---

## Step 2: Continue WinACME Process

After adding the DNS record and verifying it exists:

1. **Go back to the WinACME window** (it should still be waiting)
2. **Press Enter** or type the command to continue
3. WinACME will verify the DNS record
4. Once verified, it will generate the certificate

---

## Step 3: If WinACME Window Closed

If you closed the WinACME window, you need to start fresh:

```cmd
cd C:\win-acme
wacs.exe
```

Choose **"N: Create certificate (default settings)"** or **"M: Create certificate (full options)"**

### Quick Path (Default Settings):

1. **Choose:** `N`
2. **Enter domain:** `api.kaamlo.com`
3. **Validation:** Choose `6` (DNS manual)
4. **Add DNS TXT record** (as shown above)
5. **Storage:** Choose `2` (PEM encoded files) ⚠️ **IMPORTANT!**
6. **Installation:** Choose `3` (No additional steps)

---

## Step 4: Complete Certificate Generation

### When Using Full Options (M):

Follow these choices:

1. **Domain input:** `2` (Manual input)
2. **Host:** `api.kaamlo.com`
3. **Split certificates:** `4` (Single certificate)
4. **Validation:** `6` (DNS manual)
5. **Key type:** `2` (RSA key)
6. **Storage:** `2` (PEM encoded files) ⚠️ **CRITICAL!**
7. **Installation:** `3` (No additional steps)

### Storage Location:

When asked where to store PEM files, you can:

- **Accept default:** Usually `C:\ProgramData\win-acme\...`
- **Or specify:** `C:\nginx\ssl\api.kaamlo.com\`

**Recommended:** Use default location, it's easier to find.

---

## Step 5: Wait for DNS Propagation

After adding the DNS TXT record:

1. **Wait 1-5 minutes** for DNS to propagate
2. **Verify the record exists** (see Step 1)
3. **Then continue** in WinACME

WinACME will check the DNS record. If it's not found, you'll get an error.

---

## Step 6: Verify Certificate Files Created

After WinACME completes successfully, verify files exist:

```powershell
# Check default location
$certPath = "C:\ProgramData\win-acme\httpsacme-v02.api.letsencrypt.org\api.kaamlo.com"
Get-ChildItem $certPath

# Should show:
# - fullchain.pem (or chain.pem + cert.pem)
# - privkey.pem (or key.pem)
```

---

## Common Issues

### DNS Record Not Found

**Error:** "DNS record not found" or "Validation failed"

**Solutions:**
1. Wait longer (up to 10 minutes for DNS propagation)
2. Verify record was added correctly
3. Check for typos in the record value
4. Some DNS providers need time - wait and retry

### WinACME Says "No Renewals Created"

This means the certificate generation didn't complete. You need to:
1. Start fresh: `wacs.exe`
2. Choose "N" or "M" to create certificate
3. Complete the full process including storage

### Certificate Generated But No Files

If certificate was generated but no PEM files:
1. Run `wacs.exe`
2. Choose "A: Manage renewals"
3. Select certificate
4. Choose "R: Run renewal"
5. Add storage step: Choose "2" (PEM files)

---

## Quick Checklist

- [ ] Added DNS TXT record: `_acme-challenge.api.kaamlo.com`
- [ ] Verified DNS record exists (nslookup)
- [ ] Started/continued WinACME process
- [ ] Chose "PEM encoded files" for storage (option 2)
- [ ] Certificate generation completed successfully
- [ ] Verified certificate files exist
- [ ] Updated nginx config with certificate paths

---

## After Certificate is Generated

Once you have the PEM files, update nginx config:

```nginx
ssl_certificate C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/fullchain.pem;
ssl_certificate_key C:/ProgramData/win-acme/httpsacme-v02.api.letsencrypt.org/api.kaamlo.com/privkey.pem;
```

Then test nginx:
```cmd
cd C:\nginx
nginx.exe -t
nginx.exe -s reload
```

---

## Summary

**Current Status:** Certificate generation incomplete - DNS validation pending

**Next Steps:**
1. ✅ Add DNS TXT record
2. ✅ Verify DNS record exists
3. ✅ Complete WinACME process (choose PEM storage!)
4. ✅ Verify certificate files created
5. ✅ Configure nginx

The key is to **complete the certificate generation** and make sure you choose **"PEM encoded files"** for storage!

