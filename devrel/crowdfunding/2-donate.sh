#!/bin/bash


date '+keyreg-teal-test start %Y%m%d_%H%M%S'

set -e
set -x
set -o pipefail
export SHELLOPTS

WALLET=$1


# Directory of this bash program
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

gcmd="goal"

ACCOUNT="MT2G6WAQTSWVZFFTBUVYDOJ2OMW5KIS4IHAKRXDDCTA62IX56K3TSACJF4"

${gcmd} app optin  --app-id 13299585 --from $ACCOUNT 

${gcmd} app call --app-id 13299585 --app-arg "str:donate" --from=$ACCOUNT  --out=unsginedtransaction1.tx
${gcmd} clerk send --from=$ACCOUNT --to="MT2G6WAQTSWVZFFTBUVYDOJ2OMW5KIS4IHAKRXDDCTA62IX56K3TSACJF4" --amount=500000 --out=unsginedtransaction2.tx
cat unsginedtransaction1.tx unsginedtransaction2.tx > combinedtransactions.tx
${gcmd} clerk group -i combinedtransactions.tx -o groupedtransactions.tx 
${gcmd} clerk sign -i groupedtransactions.tx -o signout.tx
${gcmd} clerk rawsend -f signout.tx
${gcmd} app read --app-id 13299585 --guess-format --global --from $ACCOUNT
${gcmd} app read --app-id 13299585 --guess-format --local --from $ACCOUNT

rm *.tx

