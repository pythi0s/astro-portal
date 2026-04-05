# SSL Certificates

Place your SSL certificates here:
- `fullchain.pem` — Full certificate chain
- `privkey.pem` — Private key

## Get free certificates with Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Get certificate (DNS challenge for wildcard, or HTTP challenge)
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

Then uncomment the HTTPS server block in `nginx/default.conf` and restart:
```bash
docker compose --profile with-nginx up -d nginx
```
