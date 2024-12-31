#! /bin/bash

# 使用set -e选项来使脚本在遇到错误时立即退出。这样可以确保及时发现错误并停止脚本的执行。
set -e

DIR="/mnt/invoice"

read -p "请输入服务器："  HOST
read -s -p "请输入服务器密码："  PASSWORD
# 输出一下空字符串，不然下一个打印会连在“请输入服务器密码：”后面
echo ""

exec(){
    sshpass -p $PASSWORD $1
}

pack(){
    echo -e "\033[32m[打包] dist.tar\033[0m"
    tar -czf dist.tar dist

    echo -e "\033[32m[拷贝] dist.tar -> $HOST:$DIR \033[0m"
    exec "scp dist.tar $HOST:$DIR"

    echo -e "\033[32m[解压] ssh -t $HOST tar -xzf $DIR/dist.tar -C $DIR\033[0m"
    exec "ssh -t $HOST tar -xzf $DIR/dist.tar -C $DIR"
    exec "ssh -t $HOST rm $DIR/dist.tar"

    echo -e "\033[32m[删除] rm dist.tar\033[0m"
    rm dist.tar

    echo -e "\033[32m[done] 发布项目完成\033[0m"
}

# 先尝试连接服务器看能不能成功，避免后面编译后不能连的尴尬
echo "正在尝试连接服务器[$HOST]"
exec "ssh -t $HOST echo -e '\033[32m连接服务器[$HOST]成功！\033[0m'"

# 打包项目发布
pack
