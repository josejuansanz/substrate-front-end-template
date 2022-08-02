import React, { useEffect, useState } from 'react'
import { Input, Grid } from 'semantic-ui-react'

import { useSubstrate, useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

function Main(props) {
  const { api } = useSubstrateState()
  const {
    state: { currentAccount },
  } = useSubstrate()

  const [proposals, setProposals] = useState([])
  const [newProposal, setNewProposal] = useState('')
  const [user, setUser] = useState()
  const [numVotes, setNumVotes] = useState(0)

  // The transaction submission status
  const [status, setStatus] = useState('')

  const getProposals = async () => {
    const proposalsRetrieved =
      await api.query.quadraticVoting.proposals.entries()
    setProposals(
      proposalsRetrieved.map(proposal => ({
        name: proposal[0].toHuman()[0],
        votes: proposal[1].isSome ? proposal[1].unwrap()[2].toNumber() : 0,
      }))
    )
  }

  const getUserInfo = async () => {
    if (currentAccount) {
      const userInfo = await api.query.quadraticVoting.users(
        currentAccount.address
      )
      const userVotesInfo = await api.query.quadraticVoting.usersVotes(
        currentAccount.address
      )
      const userData = {
        registered: userInfo.isSome,
        remainingTokens: userInfo.isSome ? userInfo.unwrap()[1].toNumber() : 0,
        num_votes: userVotesInfo.isSome
          ? userVotesInfo.unwrap()[1].toNumber()
          : 0,
      }
      setUser(userData)
    }
  }

  const getAllInfo = () => {
    getProposals()
    getUserInfo()
  }

  useEffect(() => {
    if (currentAccount) {
      getAllInfo()
    }
  }, [currentAccount])

  useEffect(() => {
    getAllInfo()
  }, [api.query.quadraticVoting])

  useEffect(() => {
    if (status.indexOf('Finalized. Block hash:') > 0) {
      getAllInfo()
    }
  }, [status])

  return (
    <Grid.Column style={{ textAlign: 'center' }}>
      <h1 style={{ textAlign: 'left' }}>
        Quadratic Voting{' '}
        <span
          style={{
            overflowWrap: 'break-word',
            fontSize: 14,
            fontWeight: 'normal',
            marginLeft: 20,
          }}
        >
          STATUS: {status}
        </span>
      </h1>

      <div>
        {proposals.length ? (
          <>
            <div>PROPOSAL: {proposals[0].name}</div>
            <div>
              Votes:{' '}
              {proposals[0].votes === 0
                ? '0 votes'
                : proposals[0].votes > 0
                ? `${proposals[0].votes} aye votes`
                : `${Math.abs(proposals[0].votes)} nay votes`}
            </div>
          </>
        ) : (
          <div>
            <div style={{ marginBottom: 10 }}>
              NO PROPOSAL HAS BEEN MADE YET
            </div>
            <Input
              label="New Proposal"
              state="newProposal"
              type="text"
              onChange={(_, { value }) => setNewProposal(value)}
              style={{ marginRight: 10 }}
            />

            <TxButton
              label="Create Proposal"
              type="SIGNED-TX"
              setStatus={setStatus}
              attrs={{
                palletRpc: 'quadraticVoting',
                callable: 'setProposal',
                inputParams: [newProposal],
                paramFields: [true],
              }}
            />
          </div>
        )}
      </div>

      {proposals.length > 0 && user && !user.registered && (
        <div>
          <span style={{ marginRight: 10 }}>
            YOU ARE NOT REGISTERED IN THIS VOTING
          </span>
          <TxButton
            label="Register"
            type="SIGNED-TX"
            setStatus={setStatus}
            attrs={{
              palletRpc: 'quadraticVoting',
              callable: 'register',
              inputParams: [proposals[0].name],
              paramFields: [true],
            }}
          />
        </div>
      )}
      {proposals.length > 0 && user && user.registered && (
        <>
          <div style={{ marginBottom: 10 }}>
            <span style={{ marginRight: 10 }}>
              YOU ARE REGISTERED IN THIS VOTING
            </span>
            <TxButton
              label="Unregister"
              type="SIGNED-TX"
              setStatus={setStatus}
              attrs={{
                palletRpc: 'quadraticVoting',
                callable: 'unregister',
                inputParams: [proposals[0].name],
                paramFields: [true],
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            USER REMAINING TOKENS: {user.remainingTokens}
          </div>
          <div style={{ marginBottom: 10 }}>
            USER VOTES ON THIS PROPOSAL: {Math.abs(user.num_votes)}{' '}
            {user.num_votes === 0 ? '' : user.num_votes > 0 ? 'aye' : 'nay'}{' '}
            votes
          </div>
          <div>
            <Input
              label="Votes"
              state="numVotes"
              type="number"
              onChange={(_, { value }) => setNumVotes(value)}
              style={{ marginRight: 10 }}
            />
            <TxButton
              label="Vote aye"
              type="SIGNED-TX"
              setStatus={setStatus}
              color="green"
              attrs={{
                palletRpc: 'quadraticVoting',
                callable: 'vote',
                inputParams: [
                  { type: 'i8', value: numVotes },
                  { type: 'Bytes', value: proposals[0].name },
                ],
                paramFields: [
                  { name: 'numVotes', type: 'i8', optional: false },
                  { name: 'proposal', type: 'Bytes', optional: false },
                ],
              }}
              style={{ marginRight: 10 }}
            />
            <TxButton
              label="Vote nay"
              type="SIGNED-TX"
              setStatus={setStatus}
              color="red"
              attrs={{
                palletRpc: 'quadraticVoting',
                callable: 'vote',
                inputParams: [
                  { type: 'i8', value: `-${numVotes}` },
                  { type: 'Bytes', value: proposals[0].name },
                ],
                paramFields: [
                  { name: 'numVotes', type: 'i8', optional: false },
                  { name: 'proposal', type: 'Bytes', optional: false },
                ],
              }}
            />
          </div>
        </>
      )}
    </Grid.Column>
  )
}

export default function QuadraticVoting(props) {
  const { api } = useSubstrateState()
  return api.query.quadraticVoting && api.query.quadraticVoting.proposals ? (
    <Main {...props} />
  ) : null
}
