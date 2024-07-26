#!/bin/bash

# 安装Squid
sudo apt update
sudo apt install -y squid
apt install -y htpasswd

# 创建密码文件（如果尚不存在）
# 注意：这里我们假设密码文件不存在，并直接使用htpasswd命令创建
# 如果文件已存在，你可能需要手动处理或删除旧文件
PASSWORD_FILE="/etc/squid/passwords"
if [ ! -f "$PASSWORD_FILE" ]; then
     htpasswd -c "$PASSWORD_FILE" your_username  
    # 脚本运行到这里会暂停，等待你输入密码
    # 如果你想自动化这个过程，你需要考虑将密码作为脚本输入的一部分（但这样做通常不推荐，因为存在安全风险）
else
    echo "Password file $PASSWORD_FILE already exists. Skipping creation."
fi

# 编辑Squid配置文件以启用基本认证
# 注意：这里我们使用sed命令来在配置文件中添加必要的行
# 但请注意，这种方法可能会覆盖或破坏现有的配置行
# 更安全的方法是使用专用的配置文件管理工具或模板
SQUID_CONF="/etc/squid/squid.conf"
sudo sed -i '/^http_port/a\
auth_param basic program /usr/lib/squid/basic_ncsa_auth /etc/squid/passwords\n\
auth_param basic realm proxy\n\
acl authenticated proxy_auth REQUIRED\n\
http_access allow authenticated\n\
http_access deny all' "$SQUID_CONF"

# 注意：上面的sed命令假设http_port行是配置文件中的一个已知点，用于在其后添加新行
# 这可能不是最可靠的方法，因为Squid配置文件的格式可能会因版本而异
# 此外，如果你的Squid配置文件中已经包含了认证相关的行，上面的命令可能会添加重复的条目

# 重启Squid服务
sudo systemctl restart squid

echo "Squid proxy server with basic authentication has been set up."
