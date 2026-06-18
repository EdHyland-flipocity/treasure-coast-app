# Treasure Coast Intelligence Platform

A cross-platform desktop application delivering institutional-grade real estate intelligence for the Treasure Coast corridor — covering St. Lucie County (Port St. Lucie, Fort Pierce) and Martin County (Stuart, Jensen Beach, Palm City).

Features include a post-pandemic single family market report with out-of-state buyer migration analysis, buyer-seller matchmaker, motivated seller radar, flip velocity tracker with 6,000+ verified flip pairs, and a multi-county entity intelligence network tracking 26,000+ LLCs and institutional operators. Runs entirely on your local machine — no cloud, no subscriptions, no data sharing.

## What's Inside

| Tab | County | Description |
|-----|--------|-------------|
| Market Report | St. Lucie | Single family intelligence — 20K transactions, out-of-state buyer migration, S/R levels |
| Sales Registry | St. Lucie | Single family sales search and history |
| Market Report | Martin | Martin County full market analysis |
| Matchmaker | Martin | Motivated sellers matched to active buyers |
| Radar | Martin | Motivated seller radar |
| Flip Tracker | Regional | Martin County flip pairs — hold periods, gains, serial flippers |
| Entity Intel | Regional | 26,391 entities tracked across 5 counties |

---

## Requirements

- **Node.js** v18+
- **PHP** v7.4+ with `pdo_mysql` extension
- **MySQL** 8.0+ with the `rt_realestate` database imported

---

## Installation

### Linux (Ubuntu / Debian)

**1. Install Node.js v22**
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

**2. Install PHP and MySQL**
```bash
sudo apt update
sudo add-apt-repository ppa:ondrej/php -y
sudo apt install -y php8.3 php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
php --version
php -m | grep pdo_mysql
```

**3. Set up MySQL database**
```bash
sudo mysql -e "
  CREATE DATABASE rt_realestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'your_user'@'127.0.0.1' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON rt_realestate.* TO 'your_user'@'127.0.0.1';
  FLUSH PRIVILEGES;
"
# Import the database dump
mysql -u your_user -p rt_realestate < rt_realestate.sql
```

**4. Clone and set up the app**
```bash
git clone https://github.com/EdHyland-flipocity/treasure-coast-app.git
cd treasure-coast-app
chmod +x setup.sh && ./setup.sh
```

**5. Configure database credentials**
```bash
# Edit each db.php file with your MySQL credentials
for app in stlucie_report stlucie martin_report martin_matchmaker martin_radar treasure_fliptracker entity_intel; do
  cp www/$app/includes/db.php.example www/$app/includes/db.php
  nano www/$app/includes/db.php
done
```

**6. Fix sandbox permissions (Linux only)**
```bash
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

**7. Launch**
```bash
npm start
```

---

### macOS

**1. Install Homebrew** (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Install Node.js**
```bash
brew install node
node --version
```

**3. Install PHP**
```bash
brew install php
php --version
php -m | grep pdo_mysql
```

**4. Install MySQL**
```bash
brew install mysql
brew services start mysql
# Set root password
mysql_secure_installation
```

**5. Set up MySQL database**
```bash
mysql -u root -p -e "
  CREATE DATABASE rt_realestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'your_user'@'127.0.0.1' IDENTIFIED BY 'your_password';
  GRANT ALL PRIVILEGES ON rt_realestate.* TO 'your_user'@'127.0.0.1';
  FLUSH PRIVILEGES;
"
# Import the database dump
mysql -u your_user -p rt_realestate < rt_realestate.sql
```

**6. Clone and set up the app**
```bash
git clone https://github.com/EdHyland-flipocity/treasure-coast-app.git
cd treasure-coast-app
chmod +x setup.sh && ./setup.sh
```

**7. Configure database credentials**
```bash
for app in stlucie_report stlucie martin_report martin_matchmaker martin_radar treasure_fliptracker entity_intel; do
  cp www/$app/includes/db.php.example www/$app/includes/db.php
done
# Edit each www/*/includes/db.php with your MySQL credentials
```

**8. Launch**
```bash
npm start
```

> **macOS note:** On first launch you may see a security warning. Go to **System Preferences → Security & Privacy** and click **Open Anyway**.

---

### Windows

**1. Install Node.js**
- Download from https://nodejs.org (LTS version, v18 or higher)
- Run the installer — accept all defaults
- Open **Command Prompt** and verify:
```cmd
node --version
npm --version
```

**2. Install PHP**
- Download the latest PHP 8.3 Thread Safe zip from https://windows.php.net/download/
- Extract to `C:\php`
- Add `C:\php` to your system PATH:
  - Search **Environment Variables** in Start menu
  - Edit **Path** under System Variables
  - Add `C:\php`
- Copy `C:\php\php.ini-development` to `C:\php\php.ini`
- Open `C:\php\php.ini` and enable these extensions (remove the `;` at the start):
```ini
extension=pdo_mysql
extension=mysqli
extension=mbstring
extension=openssl
```
- Verify: open Command Prompt and run `php --version`

**3. Install MySQL**
- Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/
- Run the installer — choose **Developer Default**
- Set a root password during setup — remember it
- MySQL will start automatically as a Windows service

**4. Set up MySQL database**

Open **MySQL Command Line Client** from the Start menu:
```sql
CREATE DATABASE rt_realestate CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'your_user'@'127.0.0.1' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON rt_realestate.* TO 'your_user'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

Import the database (in Command Prompt):
```cmd
mysql -u your_user -p rt_realestate < rt_realestate.sql
```

**5. Clone and set up the app**

Install Git from https://git-scm.com if you don't have it, then:
```cmd
git clone https://github.com/EdHyland-flipocity/treasure-coast-app.git
cd treasure-coast-app
npm install
```

**6. Configure database credentials**

In File Explorer, navigate to each folder inside `www\` and copy `db.php.example` to `db.php`. Open each `db.php` in Notepad and update:
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'rt_realestate');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');
```

Files to update:
- `www\stlucie_report\includes\db.php`
- `www\stlucie\includes\db.php`
- `www\martin_report\includes\db.php`
- `www\martin_matchmaker\includes\db.php`
- `www\martin_radar\includes\db.php`
- `www\treasure_fliptracker\includes\db.php`
- `www\entity_intel\includes\db.php`

**7. Launch**
```cmd
npm start
```

---

## Database Configuration

Each app module has its own `includes/db.php`. Copy from the `.example` file and fill in your credentials:

```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'rt_realestate');
define('DB_USER', 'your_mysql_user');
define('DB_PASS', 'your_mysql_password');
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+1 | SL Market Report |
| Ctrl+2 | SL Sales Registry |
| Ctrl+3 | Martin Report |
| Ctrl+4 | Martin Matchmaker |
| Ctrl+5 | Martin Radar |
| Ctrl+6 | Flip Tracker |
| Ctrl+7 | Entity Intel |
| Ctrl+R | Refresh current tab |

---

## Building Installers

```bash
# Linux (AppImage + .deb)
npm run build:linux

# Windows (.exe installer)
npm run build:win

# macOS (.dmg)
npm run build:mac

# All platforms
npm run build:all
```

Outputs are placed in the `dist/` folder.

---

## Part of the Florida Real Estate Intelligence Suite

- [Brevard Intelligence](https://github.com/EdHyland-flipocity/florida-realestate-intelligence)
- [Sarasota Intelligence](https://github.com/EdHyland-flipocity/sarasota-intelligence)
- [Pinellas Intelligence](https://github.com/EdHyland-flipocity/pinellas-intelligence)
- [Treasure Coast Intelligence](https://github.com/EdHyland-flipocity/treasure-coast-app)

---

## License

MIT License — see LICENSE file for details.
