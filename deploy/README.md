# Raspberry Pi Deployment Guide

The 12 steps from the project plan, in order. Each step matches a box on
the FigJam board ("RASPBERRY PI SERVER" branch).

## 1. Hardware
Raspberry Pi 4 (2GB+ is plenty), running 24/7 with a decent power supply.

## 2. OS setup
Flash **Raspberry Pi OS Lite** with the Raspberry Pi Imager and enable SSH
in the imager settings. Boot and `ssh pi@<pi-ip>`.

## 3. Install software
```bash
sudo apt update && sudo apt install -y python3-venv git nginx
```

## 4. Clone the project
```bash
cd ~
git clone https://github.com/AnthonyMIN2004/Collageportal-betatest-DummyProject.git
cd Collageportal-betatest-DummyProject
```

## 5. Run the backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --port 8000   # test run — Ctrl+C when it works
```

## 6. Nginx (reverse proxy + static frontend)
```bash
sudo cp ../deploy/nginx.conf /etc/nginx/sites-available/kiritan-portal
sudo ln -s /etc/nginx/sites-available/kiritan-portal /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```
Now `http://<pi-ip>/` serves the portal and `/api/` hits the backend.

## 7. Router config
In your router settings, forward ports **80** and **443** to the Pi's local
IP. Give the Pi a static local IP (DHCP reservation) while you're there.

## 8. Domain or IP
Get your public IP (`curl ifconfig.me`) or point a domain's A-record at it.
A free dynamic-DNS name (e.g. DuckDNS) works well on a home connection.

## 9. SSL certificate (HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example.com
```

## 10. Autostart (systemd)
Edit the secrets in `deploy/kiritan-portal.service` first, then:
```bash
sudo cp ../deploy/kiritan-portal.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kiritan-portal
```

## 11. Firewall
```bash
sudo apt install -y ufw
sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443
sudo ufw enable
```

## 12. LIVE 🎉
Students open the domain/IP from anywhere, log in with their student ID,
and the portal is served from the Pi in your room.

### Before real students touch it
- [ ] Set `PORTAL_SECRET` to a long random string (step 10 file)
- [ ] Set `PORTAL_ADMIN_PW` to a real password
- [ ] Change the seeded student passwords (default = student ID)
- [ ] Set `PORTAL_CORS` to your real domain
