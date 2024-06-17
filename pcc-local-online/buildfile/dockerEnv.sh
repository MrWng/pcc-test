#!/bin/sh

function log_info()
{
  local date=`date`
  local para=$1
  echo "$date $1"
  $1
  echo "log info:$date $1" &>> $SYS_LOG
}
SYS_LOG=dockerEnv.log

#程式路徑
Path=$1
#檔案類型
TypeName=$2
#排除檔案
removeName=$3

#修改方法一
find $Path/ -name "*.$TypeName" -a ! -name "$removeName"  | xargs  grep -r '@' > envSpace.txt

sed 's/[[:space:]]//g' envSpace.txt > env.txt
envDate=$(cat env.txt)

#迴圈解析@
for date in ${envDate}; do
 #echo $date
 field=2
 env=test
 filePath=$(cut -d':' -f1 <<< "$date")
 #echo $filePath
 while [[ "$env" != ""  ]]; do
  env=$(cut -d'@' -f$field <<< "$date")
  let "field+=2"
  if [ "$env" != "" ]; then
   #修改方法二
   envReplace=${env//./_}
   log_info "sed -i s#@"$env"@#"$(eval echo \$$envReplace)"#g $filePath"
  fi
 done
done

rm -f envSpace.txt
rm -f env.txt

