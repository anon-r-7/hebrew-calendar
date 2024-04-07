#!/usr/bin/env sh

yarn db:migrate
yarn db:seed
yarn $1