#!/usr/bin/env sh 
set -eu 
envsubst '${API_URL} ${UI_URL}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec "$@"