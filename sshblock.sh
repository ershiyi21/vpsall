#!/bin/bash
fail2ban-client -V
if [[ $? == 0 ]],then
sudo apt-get update
sudo apt-get install fail2ban
fi
##连续10次错误，封禁10小时
echo "[sshd]
enabled = true
port = 22
maxretry = 10
findtime = 600
bantime = 36000" > /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
