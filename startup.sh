#!/bin/bash

case $1 in

	reload)
		pkill -HUP -f "cash"
		sleep 3
		ps -aux 2> /dev/null |grep cash_ 1>ps.log
		cat ps.log
	;;

	restart)
		kill -9 `pgrep -f share_` > ps.log 2>&1
		sleep 1
		node server.js $2 $3 > /opt/logs/cash.log 2>&1 &
		sleep 2
		ps -aux 2> /dev/null |grep cash_ 1>ps.log
		cat ps.log
	;;

	*)
		echo "参数不正确吗, 请使用sh -harmony startup.sh reload or sh startup.sh restart"

esac




