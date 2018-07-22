#!/bin/bash

source $HOME/.bashrc

SCRIPTPATH="$( cd "$(dirname "$0")" ; pwd -P )"
cd $SCRIPTPATH/..
npm run grabber