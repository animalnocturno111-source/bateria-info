# Ajusta el proyecto Android generado por Capacitor:
#  - Bluetooth sin pedir ubicación en Android 12+ (neverForLocation)
#  - Número de versión = número de compilación (para que las actualizaciones se instalen encima)
import re
import sys

run = int(sys.argv[1]) if len(sys.argv) > 1 else 1

man_path = "android/app/src/main/AndroidManifest.xml"
man = open(man_path, encoding="utf-8").read()
if "xmlns:tools" not in man:
    man = man.replace("<manifest ", '<manifest xmlns:tools="http://schemas.android.com/tools" ', 1)
perms = """
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" android:maxSdkVersion="30" tools:node="replace" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" tools:node="replace" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" tools:targetApi="s" tools:node="replace" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" tools:targetApi="s" />
"""
man = re.sub(r"(<manifest[^>]*>)", r"\1" + perms, man, count=1)
open(man_path, "w", encoding="utf-8").write(man)

gradle_path = "android/app/build.gradle"
g = open(gradle_path, encoding="utf-8").read()
g = re.sub(r"versionCode \d+", f"versionCode {run}", g)
g = re.sub(r'versionName "[^"]*"', f'versionName "1.{run}"', g)
open(gradle_path, "w", encoding="utf-8").write(g)
print("Android ajustado, versión", run)
