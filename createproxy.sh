#!/bin/bash

# 安装Squid
sudo apt update
sudo apt install -y squid
sudo apt install -y apache2-utils

PASSWORD_FILE="/etc/squid/passwords"    
USERNAME="usermame"  # 设置用户名  
PASSWORD="wlxsykd"  # 设置密码  
  
if [ ! -f "$PASSWORD_FILE" ]; then  
    # 使用echo和管道自动传递用户名和密码给htpasswd  
    echo -e "$USERNAME:$PASSWORD" | sudo tee "$PASSWORD_FILE" > /dev/null  
    # 更改密码文件的权限，确保只有root可以访问  
    sudo chmod 600 "$PASSWORD_FILE"  
    # 如果你的Squid使用htpasswd格式的密码文件，并且需要加密密码，  
    # 你可能需要先手动运行一次htpasswd来创建加密的密码文件，  
    # 然后用上面的方法替换文件中的密码（但这需要知道加密密码的格式）。  
    # 另一个选择是使用专门的工具或脚本来加密密码，然后添加到文件中。  
    # 注意：下面的命令假设你已经有了加密的密码  
    # sudo htpasswd -b -c "$PASSWORD_FILE" "$USERNAME" "$ENCRYPTED_PASSWORD"  
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
