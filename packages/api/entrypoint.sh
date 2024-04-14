#!/usr/bin/env sh

yarn db:migrate:undo:last
yarn db:migrate
yarn $1