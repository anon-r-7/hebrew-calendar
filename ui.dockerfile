FROM node:20 as builder

# Add Build Assets
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ENV PATH /usr/src/app/node_modules/.bin:$PATH
ADD . /usr/src/app/

# Install Build Deps
RUN yarn
WORKDIR /usr/src/app/packages/ui
RUN yarn build

FROM nginx:alpine as final

LABEL org.opencontainers.image.source=https://github.com/anon-r-7/hebrew-calendar

# Install Runtime Deps
RUN apk add --update nodejs npm
ENV PATH /usr/src/app/node_modules/.bin:$PATH
RUN npm i -g cheerio

# Add Runtime Assets
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=builder /usr/src/app/packages/ui/build .

# Define scripts
COPY --from=builder /usr/src/app/packages/ui/scripts/setEnvVars.js /scripts/
COPY --from=builder /usr/src/app/packages/ui/entrypoint.sh /entrypoint.sh

# Configure nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/packages/ui/nginx.conf /etc/nginx/conf.d
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

EXPOSE 80
WORKDIR /scripts
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
