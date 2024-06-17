# 打包專案
FROM        registry.digiwincloud.com.cn/base/digiwin_alpine_nginx:1.12.1
ENV         buildfile=./buildfile
COPY        ./dist/ /usr/share/nginx/html/package-pcc/
ADD         ${buildfile}/nginx.conf /etc/nginx/
ADD         ${buildfile}/default.conf /etc/nginx/conf.d/
ADD         ${buildfile}/frontendShell.sh /usr/share/nginx/html/
ADD         ${buildfile}/dockerEnv.sh /usr/share/nginx/html/
RUN         chmod +x /usr/share/nginx/html/frontendShell.sh
RUN         chmod +x /usr/share/nginx/html/dockerEnv.sh
WORKDIR     /usr/share/nginx/html
EXPOSE      80
ENTRYPOINT ["/usr/share/nginx/html/frontendShell.sh"]
