import requests
import csv
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

def check_proxy(row, api_url_template):
    ip, port = row[0].strip(), row[1].strip()
    api_url = api_url_template.format(ip=ip, port=port)
    try:
        response = requests.get(api_url, timeout=180)
        response.raise_for_status()
        data = response.json()

        message = data.get("message", "").strip().upper()
        if "ACTIVE ✅" in message:
            proxy_id = data.get("country", "Unknown").split()[0]  # Ambil kode negara saja
            isp = data.get("isp", "Unknown")

            if proxy_id != "Unknown" and isp != "Unknown":
                print(f"{ip}:{port} is ALIVE ✅ - ID: {proxy_id}, ISP: {isp}")
                return (ip, port, proxy_id, isp), None
            else:
                error_message = f"{ip}:{port} has Unknown ID/ISP (ID: {proxy_id}, ISP: {isp})"
                print(error_message)
                return None, error_message
        else:
            print(f"{ip}:{port} is DEAD ❌")
            return None, None
    except requests.exceptions.RequestException as e:
        error_message = f"Error checking {ip}:{port}: {e}"
        print(error_message)
        return None, error_message

def main():
    input_file = os.getenv('IP_FILE', 'proxyip.txt')
    update_file = 'update_proxyip.txt'
    error_file = 'error.txt'
    api_url_template = os.getenv('API_URL', 'https://proxy.ndeso.xyz/check?ip={ip}:{port}')

    alive_proxies = []
    error_logs = []

    try:
        with open(input_file, "r") as f:
            reader = csv.reader(f)
            rows = list(reader)
    except FileNotFoundError:
        print(f"File {input_file} tidak ditemukan.")
        return

    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = {executor.submit(check_proxy, row, api_url_template): row for row in rows if len(row) >= 2}

        for future in as_completed(futures):
            alive, error = future.result()
            if alive:
                alive_proxies.append(alive)
            if error:
                error_logs.append(error)

    # Urutkan hasil berdasarkan proxy_id (kolom ketiga)
    alive_proxies.sort(key=lambda x: x[2])  # Urutkan berdasarkan proxy_id (ID negara)

    # Simpan hasil proxy yang aktif
    try:
        with open(update_file, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerows(alive_proxies)
        print(f"Proxy yang ALIVE telah disimpan di {update_file}.")
    except Exception as e:
        print(f"Error menulis ke {update_file}: {e}")
        return

    # Simpan log error jika ada
    if error_logs:
        try:
            with open(error_file, "w") as f:
                for error in error_logs:
                    f.write(error + "\n")
            print(f"Beberapa error telah dicatat di {error_file}.")
        except Exception as e:
            print(f"Error menulis ke {error_file}: {e}")
            return

if __name__ == "__main__":
    main()
