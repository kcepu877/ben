import os
import yaml
import re

# === Fungsi baca/tulis YAML ===
def read_yaml(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return yaml.load(file, Loader=yaml.FullLoader)
    return {}

def write_yaml(data, file_path):
    with open(file_path, 'w') as file:
        yaml.dump(data, file)

# === Baca daftar subdomain ===
def read_subdomain_list(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return [line.strip() for line in file if line.strip()]
    return []

# === Fungsi mengganti subdomain di file ===
def replace_subdomain_in_file(file_path, old_subdomain, new_subdomain, domains):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    with open(file_path, 'r') as file:
        content = file.read()

    for domain in domains:
        # Pola untuk mencari subdomain sebelum domain utama
        pattern = rf'(?<!\w){re.escape(old_subdomain)}(?=\.{re.escape(domain)})'
        # Ganti semua kemunculan subdomain yang cocok
        content = re.sub(pattern, new_subdomain, content)

    with open(file_path, 'w') as file:
        file.write(content)

def main():
    # File konfigurasi
    yaml_file = 'subdomain.yml'
    list_file = 'subdomain_list.txt'
    
    # 10 Domain utama
    domains = [
        'zifxoyfpuf0uf0ycphcoyf0684wd.us.kg',
        'xhamster.biz.id',
        'bmkg.xyz',
        'ndeso.xyz',
        'ndeso.web.id',
        'kere.us.kg',
        'cepu.us.kg',
        'turah.my.id',
        'najah.biz.id',
        'cloudproxyip.my.id'
    ]
    
    # Daftar file yang akan diproses
    toml_file = 'wrangler.toml'
    worker_js_file = 'js/_worker.js'  # Tambahan file worker.js
    html_files = [
        'index.html',
        'domain/zifxoyfpuf0uf0ycphcoyf0684wd.html',
        'domain/xhamster.html',
        'domain/bmkg.html',
        'domain/ndeso.html',
        'domain/ndeso-xyz.html',
        'domain/kere.html',
        'domain/cepu.html',
        'domain/turah.html',
        'domain/najah.html',
        'domain/cloudproxyip.html'
    ]

    # Baca daftar subdomain dan subdomain terakhir
    subdomain_list = read_subdomain_list(list_file)
    if not subdomain_list:
        print("Subdomain list is empty or not found!")
        return

    config = read_yaml(yaml_file)
    last_subdomain = config.get('subdomain', subdomain_list[0])

    # Pastikan subdomain terakhir ada dalam daftar
    if last_subdomain not in subdomain_list:
        print(f"Last subdomain '{last_subdomain}' not in subdomain list!")
        return

    # Cari subdomain berikutnya
    current_index = subdomain_list.index(last_subdomain)
    next_index = (current_index + 1) % len(subdomain_list)
    next_subdomain = subdomain_list[next_index]

    # Ganti subdomain hanya di bagian awal sebelum domain utama
    replace_subdomain_in_file(toml_file, last_subdomain, next_subdomain, domains)
    replace_subdomain_in_file(worker_js_file, last_subdomain, next_subdomain, domains)  # Ganti di worker.js
    for html_file in html_files:
        replace_subdomain_in_file(html_file, last_subdomain, next_subdomain, domains)

    # Simpan subdomain yang digunakan
    config['subdomain'] = next_subdomain
    write_yaml(config, yaml_file)
    print(f"Subdomain updated to: {next_subdomain}")

if __name__ == "__main__":
    main()
