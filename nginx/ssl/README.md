# SSL Certificates

Place your SSL certificate files here:

- `fullchain.pem`  — full certificate chain
- `privkey.pem`    — private key

## Getting a free certificate with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot

# Get certificate (stop nginx first if on port 80)
sudo certbot certonly --standalone -d smartquran.app -d www.smartquran.app

# Certificates will be at:
# /etc/letsencrypt/live/smartquran.app/fullchain.pem
# /etc/letsencrypt/live/smartquran.app/privkey.pem

# Copy or symlink into this directory
cp /etc/letsencrypt/live/smartquran.app/fullchain.pem ./fullchain.pem
cp /etc/letsencrypt/live/smartquran.app/privkey.pem ./privkey.pem
```

## Dev / HTTP-only mode

If you don't have SSL yet, edit `nginx/nginx.conf`:
- Remove the `server { listen 80 ... return 301 }` block
- Change the second server block to `listen 80` and remove all `ssl_*` lines
