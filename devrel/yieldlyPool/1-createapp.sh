#!/bin/bash
# creates and updates the app

date '+keyreg-teal-test start %Y%m%d_%H%M%S'

set -e
set -x
set -o pipefail
export SHELLOPTS

WALLET=$1


# Directory of this bash program
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

gcmd="goal"
gcmd2="goal"

# Get one account from each node
ACCOUNT="MT2G6WAQTSWVZFFTBUVYDOJ2OMW5KIS4IHAKRXDDCTA62IX56K3TSACJF4"


# Get date timestamps to pass in
# this example only uses a 120 second fundraising time
s=120
ss=600
bd=$(date '+%s')
# fund begin date
echo ${bd}
ed=$(( $bd + $s ))
# fund end date
echo ${ed}
cd=$(($ed + $ss))
# fund close date
echo ${cd}

# Create the App and then update it with the stateless teal escrow
APPID=$(${gcmd} app create --creator ${ACCOUNT} --approval-prog ./crowd_fund.teal --global-byteslices 3 --global-ints 5 --local-byteslices 0 --local-ints 1 --app-arg "int:"${bd} --app-arg "int:"${ed} --app-arg "int:1000000" --app-arg "addr:"${ACCOUNT} --app-arg "int:"${cd} --clear-prog ./crowd_fund_close.teal | grep Created | awk '{ print $6 }')
UPDATE=$(${gcmd} app update --app-id=${APPID} --from ${ACCOUNT}  --approval-prog ./crowd_fund.teal   --clear-prog ./crowd_fund_close.teal --app-arg "addr:${ACCOUNT}" )

#optin the creator account
${gcmd} app optin  --app-id $APPID --from $ACCOUNT 

echo "App ID="$APPID 
${gcmd} app read --app-id $APPID --guess-format --global --from $ACCOUNT

