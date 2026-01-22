# Making Server Accessible to Other Devices

This guide explains how to make your Nagar Parishad backend server accessible from other devices on your network.

---

## Step 1: Update Server Configuration

The server is already configured to listen on all network interfaces (`0.0.0.0`). This means it will accept connections from any device on your network.

### Verify Configuration

Check `server.js` - it should have:
```javascript
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, ...);
```

---

## Step 2: Find Your Machine's IP Address

### Windows

**Method 1: Command Prompt**
```cmd
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).

**Method 2: PowerShell**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"}
```

**Method 3: Settings**
1. Open Settings → Network & Internet
2. Click on your connection (Wi-Fi or Ethernet)
3. Scroll down to find "IPv4 address"

### macOS

**Terminal:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Or:
```bash
ipconfig getifaddr en0  # For Wi-Fi
ipconfig getifaddr en1  # For Ethernet
```

### Linux

**Terminal:**
```bash
hostname -I
```

Or:
```bash
ip addr show
```

---

## Step 3: Configure Windows Firewall

### Allow Port Through Firewall

**Method 1: Windows Defender Firewall GUI**

1. Open **Windows Defender Firewall**
2. Click **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Select **Port** → **Next**
5. Select **TCP** and enter port `3000` (or your PORT) → **Next**
6. Select **Allow the connection** → **Next**
7. Check all profiles (Domain, Private, Public) → **Next**
8. Name it "Nagar Parishad Backend" → **Finish**

**Method 2: Command Line (Run as Administrator)**

```cmd
netsh advfirewall firewall add rule name="Nagar Parishad Backend" dir=in action=allow protocol=TCP localport=3000
```

**Method 3: PowerShell (Run as Administrator)**

```powershell
New-NetFirewallRule -DisplayName "Nagar Parishad Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

## Step 4: Start the Server

```bash
npm start
# or
npm run dev
```

The server will display network access information:
```
Server is running on http://0.0.0.0:3000
Environment: development

=== Network Access Information ===
Local access: http://localhost:3000
Network access: http://192.168.1.100:3000
===================================
```

---

## Step 5: Access from Other Devices

### From Another Device on Same Network

1. **Find your server's IP address** (from Step 2)
   - Example: `192.168.1.100`

2. **Access the API from another device:**
   ```
   http://192.168.1.100:3000
   ```

3. **Test with curl (from another device):**
   ```bash
   curl http://192.168.1.100:3000/health
   ```

4. **Test in browser (from another device):**
   ```
   http://192.168.1.100:3000/api/schools
   ```

### From Mobile Device

1. Connect your mobile device to the **same Wi-Fi network**
2. Open browser and go to:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   Example: `http://192.168.1.100:3000`

3. Test the API:
   ```
   http://192.168.1.100:3000/api/schools
   ```

---

## Step 6: Configure PostgreSQL for Network Access (If Needed)

If you want other devices to access PostgreSQL directly (not recommended for security), you need to:

### 1. Edit PostgreSQL Configuration

**Find `postgresql.conf`:**
- Windows: Usually in `C:\Program Files\PostgreSQL\15\data\postgresql.conf`
- Linux: Usually in `/etc/postgresql/15/main/postgresql.conf`

**Edit the file:**
```conf
listen_addresses = '*'  # Allow connections from all IPs
# or
listen_addresses = 'localhost,192.168.1.100'  # Specific IPs
```

### 2. Edit pg_hba.conf

**Find `pg_hba.conf`** (same directory as postgresql.conf)

**Add line:**
```
host    nagarparishad_db    postgres    192.168.1.0/24    md5
```
This allows connections from 192.168.1.x network.

### 3. Restart PostgreSQL

**Windows:**
```cmd
net stop postgresql-x64-15
net start postgresql-x64-15
```

**Linux:**
```bash
sudo systemctl restart postgresql
```

**Note:** For this backend API, you typically don't need to expose PostgreSQL - the API server handles database connections.

---

## Step 7: Update Environment Variables (Optional)

You can specify the host in `.env`:

```env
HOST=0.0.0.0
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nagarparishad_db
DB_USER=postgres
DB_PASSWORD=your_password
NODE_ENV=development
```

---

## Troubleshooting

### Cannot Connect from Other Devices

1. **Check Firewall:**
   ```cmd
   # Windows - Check if rule exists
   netsh advfirewall firewall show rule name="Nagar Parishad Backend"
   ```

2. **Verify Server is Running:**
   ```bash
   # On server machine
   curl http://localhost:3000/health
   ```

3. **Check IP Address:**
   - Make sure you're using the correct IP address
   - IP address may change if using DHCP

4. **Verify Same Network:**
   - Both devices must be on the same network (same Wi-Fi/router)

5. **Test Connection:**
   ```bash
   # From another device, test if port is reachable
   telnet YOUR_IP_ADDRESS 3000
   # or
   nc -zv YOUR_IP_ADDRESS 3000
   ```

### Port Already in Use

```bash
# Windows - Find what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Connection Refused

- Check if server is actually running
- Verify firewall allows the port
- Check if antivirus is blocking the connection

### CORS Errors

CORS is already configured in `server.js` with `app.use(cors())`, which allows all origins. For production, you may want to restrict this:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.100:3000'],
  credentials: true
}));
```

---

## Security Considerations

### For Development (Current Setup)
- ✅ CORS allows all origins
- ✅ Server accessible on local network
- ⚠️ No authentication required

### For Production

1. **Add Authentication:**
   - Implement JWT tokens or API keys
   - Add rate limiting

2. **Restrict CORS:**
   ```javascript
   app.use(cors({
     origin: ['https://yourdomain.com'],
     credentials: true
   }));
   ```

3. **Use HTTPS:**
   - Set up SSL/TLS certificate
   - Use reverse proxy (nginx, Apache)

4. **Firewall Rules:**
   - Only allow specific IPs if possible
   - Use VPN for remote access

5. **Database Security:**
   - Don't expose PostgreSQL to network
   - Use strong passwords
   - Limit database user permissions

---

## Quick Test Commands

### From Server Machine
```bash
# Test local access
curl http://localhost:3000/health

# Test network access (replace with your IP)
curl http://192.168.1.100:3000/health
```

### From Another Device
```bash
# Replace with server's IP address
curl http://192.168.1.100:3000/api/schools
```

### From Browser (Any Device)
```
http://YOUR_IP_ADDRESS:3000/health
http://YOUR_IP_ADDRESS:3000/api/schools
```

---

## Example: Complete Setup

1. **Server Machine (Windows):**
   ```cmd
   # Find IP
   ipconfig
   # Output: IPv4 Address: 192.168.1.100

   # Allow firewall
   netsh advfirewall firewall add rule name="Nagar Parishad Backend" dir=in action=allow protocol=TCP localport=3000

   # Start server
   npm start
   ```

2. **Client Device (Mobile/Other PC):**
   - Connect to same Wi-Fi
   - Open browser: `http://192.168.1.100:3000`
   - Test API: `http://192.168.1.100:3000/api/schools`

---

## Summary

✅ Server listens on `0.0.0.0` (all interfaces)  
✅ CORS enabled for cross-origin requests  
✅ Find your IP address  
✅ Configure firewall to allow port 3000  
✅ Access from other devices using `http://YOUR_IP:3000`

Your server should now be accessible from any device on your local network!



