export const sampleNmapXml = `<?xml version="1.0" encoding="UTF-8"?>
<nmaprun scanner="nmap" args="nmap -A -T4 --script default,vuln 10.10.40.0/24" start="1720447200" version="7.95">
  <host starttime="1720447202" endtime="1720447242">
    <status state="up" reason="syn-ack" reason_ttl="64"/>
    <address addr="10.10.40.1" addrtype="ipv4"/>
    <address addr="00:15:5D:01:10:01" addrtype="mac" vendor="Palo Alto Networks"/>
    <hostnames><hostname name="edge-fw-01.corp.local" type="PTR"/></hostnames>
    <times srtt="21000" rttvar="6000" to="100000"/>
    <ports>
      <port protocol="tcp" portid="22"><state state="open"/><service name="ssh" product="OpenSSH" version="8.2p1" extrainfo="Ubuntu"/></port>
      <port protocol="tcp" portid="443"><state state="open"/><service name="https" product="Fortinet FortiGate SSL VPN" version="6.0" tunnel="ssl"/></port>
      <port protocol="udp" portid="161"><state state="open"/><service name="snmp" product="net-snmp" version="5.7"/></port>
    </ports>
    <os><osmatch name="FortiOS network firewall" accuracy="93"/></os>
    <hostscript>
      <script id="ssl-enum-ciphers" output="TLSv1.0 supported; weak cipher suites accepted"/>
      <script id="snmp-info" output="community string public responded; system name edge-fw-01"/>
    </hostscript>
  </host>
  <host starttime="1720447203" endtime="1720447231">
    <status state="up" reason="syn-ack" reason_ttl="128"/>
    <address addr="10.10.40.12" addrtype="ipv4"/>
    <address addr="00:50:56:A4:2C:12" addrtype="mac" vendor="VMware"/>
    <hostnames><hostname name="filesrv-legacy.corp.local" type="PTR"/></hostnames>
    <times srtt="18000" rttvar="5000" to="100000"/>
    <ports>
      <port protocol="tcp" portid="135"><state state="open"/><service name="msrpc" product="Microsoft Windows RPC"/></port>
      <port protocol="tcp" portid="139"><state state="open"/><service name="netbios-ssn" product="Microsoft Windows netbios-ssn"/></port>
      <port protocol="tcp" portid="445"><state state="open"/><service name="microsoft-ds" product="Windows Server 2008 SMB" version="SMBv1"/></port>
      <port protocol="tcp" portid="3389"><state state="open"/><service name="ms-wbt-server" product="Microsoft Terminal Services" version="Windows Server 2008"/></port>
    </ports>
    <os><osmatch name="Microsoft Windows Server 2008 R2" accuracy="98"/></os>
    <hostscript>
      <script id="smb-protocols" output="SMBv1 enabled; message signing disabled"/>
      <script id="smb-vuln-ms17-010" output="VULNERABLE: Remote Code Execution vulnerability in Microsoft SMBv1 servers (ms17-010)"/>
    </hostscript>
  </host>
  <host starttime="1720447204" endtime="1720447221">
    <status state="up" reason="syn-ack" reason_ttl="64"/>
    <address addr="10.10.40.21" addrtype="ipv4"/>
    <address addr="BC:24:11:9A:8D:21" addrtype="mac" vendor="Supermicro"/>
    <hostnames><hostname name="web-prod-01.corp.local" type="PTR"/></hostnames>
    <times srtt="12000" rttvar="3000" to="100000"/>
    <ports>
      <port protocol="tcp" portid="22"><state state="open"/><service name="ssh" product="OpenSSH" version="7.1"/></port>
      <port protocol="tcp" portid="80"><state state="open"/><service name="http" product="Apache httpd" version="2.4.49"/></port>
      <port protocol="tcp" portid="443"><state state="open"/><service name="https" product="Apache httpd" version="2.4.49" tunnel="ssl"/></port>
    </ports>
    <os><osmatch name="Ubuntu Linux 18.04" accuracy="95"/></os>
    <hostscript>
      <script id="http-title" output="Corporate Portal - default page"/>
      <script id="http-security-headers" output="Missing X-Frame-Options; Missing Content-Security-Policy"/>
      <script id="ssl-enum-ciphers" output="TLSv1.0 supported"/>
    </hostscript>
  </host>
  <host starttime="1720447205" endtime="1720447227">
    <status state="up" reason="syn-ack" reason_ttl="64"/>
    <address addr="10.10.40.44" addrtype="ipv4"/>
    <address addr="B8:27:EB:64:44:44" addrtype="mac" vendor="Raspberry Pi Foundation"/>
    <hostnames><hostname name="iot-camera-44.corp.local" type="PTR"/></hostnames>
    <times srtt="35000" rttvar="12000" to="100000"/>
    <ports>
      <port protocol="tcp" portid="23"><state state="open"/><service name="telnet" product="BusyBox telnetd"/></port>
      <port protocol="tcp" portid="80"><state state="open"/><service name="http" product="GoAhead-Webs" version="2.5"/></port>
    </ports>
    <os><osmatch name="Embedded Linux IoT camera" accuracy="91"/></os>
    <hostscript>
      <script id="http-title" output="Default device configuration page"/>
    </hostscript>
  </host>
  <host starttime="1720447206" endtime="1720447232">
    <status state="up" reason="syn-ack" reason_ttl="64"/>
    <address addr="10.10.40.70" addrtype="ipv4"/>
    <address addr="52:54:00:61:70:70" addrtype="mac" vendor="QEMU"/>
    <hostnames><hostname name="data-cache-01.corp.local" type="PTR"/></hostnames>
    <times srtt="9000" rttvar="2500" to="100000"/>
    <ports>
      <port protocol="tcp" portid="6379"><state state="open"/><service name="redis" product="Redis key-value store" version="6.0"/></port>
      <port protocol="tcp" portid="27017"><state state="open"/><service name="mongodb" product="MongoDB" version="4.2"/></port>
    </ports>
    <os><osmatch name="Debian Linux 10" accuracy="96"/></os>
    <hostscript>
      <script id="redis-info" output="Redis server info; no authentication required"/>
      <script id="mongodb-info" output="MongoDB unauthorized database listing visible"/>
    </hostscript>
  </host>
  <runstats>
    <finished time="1720447280" elapsed="78.12" summary="Nmap done at Mon Jul 8 11:21:20 2024; 256 IP addresses (5 hosts up) scanned"/>
  </runstats>
</nmaprun>`;
