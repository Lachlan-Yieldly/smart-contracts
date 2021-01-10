#!/bin/bash

date '+keyreg-teal-test start %Y%m%d_%H%M%S'

set -e
set -x
set -o pipefail
export SHELLOPTS

WALLET=$1

# Directory of this bash program
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

gcmd="../../goal -d ../test/Primary"

ACCOUNT=$(${gcmd} account list|awk '{ print $3 }'|head -n 1)

# pass in the escrow account to accounts array to check if it is empty
${gcmd} app delete --app-id 1 --from $ACCOUNT  --app-account=F4HJHVIPILZN3BISEVKXL4NSASZB4LRB25H4WCSEENSPCJ5DYW6CKUVZOA --out=txn1.tx
${gcmd} clerk send --from-program=./reward_fund_escrow.teal --to=$ACCOUNT --amount=0 -c $ACCOUNT --out=txn2.tx


cat txn1.tx txn2.tx > combinedtxn.tx
${gcmd} clerk group -i combinedtxn.tx -o groupedtxn.tx 
${gcmd} clerk split -i groupedtxn.tx -o split.tx 

${gcmd} clerk sign -i split-0.tx -o signout-0.tx
cat signout-0.tx split-1.tx > signout.tx
${gcmd} account dump -a $ACCOUNT -o br.msgp
#../../tealdbg debug --txn signout.tx --balance br.msgp
${gcmd} clerk rawsend -f signout.tx

rm *.tx

