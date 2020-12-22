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

ACCOUNT="ZFC4CAF3Y2RTJMN64UXXGVII2HONNI6JOVKQKMHWC7JI6IZW2UIX236KQ4"

APPID="13309949"

#${gcmd} app optin  --app-id $APPID --from $ACCOUNT 

${gcmd} app call --app-id $APPID --app-arg "str:donate" --from=$ACCOUNT  --out=unsginedtransaction1.tx
${gcmd} clerk send --from=$ACCOUNT --to="ZLDJ3Z75ICJR52UGF4T72LZ4CUN6GGSVK6FAWWSHGHTP6T5ANALLAAGIKE" --amount=100000 --out=unsginedtransaction2.tx
cat unsginedtransaction1.tx unsginedtransaction2.tx > combinedtransactions.tx
${gcmd} clerk group -i combinedtransactions.tx -o groupedtransactions.tx 
${gcmd} clerk sign -i groupedtransactions.tx -o signout.tx
#${gcmd} clerk rawsend -f signout.tx
${gcmd} clerk dryrun -t signout.tx --dryrun-dump -o dump1.dr
tealdbg debug crowd_fund.teal -d dump1.dr
${gcmd} app read --app-id $APPID --guess-format --global --from $ACCOUNT
${gcmd} app read --app-id $APPID --guess-format --local --from $ACCOUNT

rm *.tx

