#!/bin/bash

mkdir -p /opt/aria2/temp && cd /opt/aria2/temp
wget https://github.com/P3TERX/Aria2-Pro-Core/releases/download/1.36.0_2021.08.22/aria2-1.36.0-static-linux-amd64.tar.gz
tar -zxvf aria2-1.36.0-static-linux-amd64.tar.gz
mv aria2c /usr/local/bin
rm -rf /opt/aria2/temp
mkdir /opt/aria2/config && mkdir /opt/aria2/downloads && touch /opt/aria2/config/aria2.session

wget -P /opt/aria2/config https://raw.githubusercontent.com/ershiyi21/vpsall/main/file/aria2.conf

mkdir -p /usr/lib/systemd/system
echo "[Unit]
Description=aria2c

[Service]
ExecStart=aria2c --conf-path=/opt/aria2/config/aria2.conf
Restart=on-abnormal

[Install]
WantedBy=multi-user.target" > /usr/lib/systemd/system/aria2.service

systemctl enable aria2
systemctl start aria2
