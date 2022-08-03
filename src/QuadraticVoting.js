import React, { useEffect, useState } from 'react'
import { Input, Grid } from 'semantic-ui-react'

import { useSubstrate, useSubstrateState } from './substrate-lib'
import { TxButton } from './substrate-lib/components'

function Main(props) {
  const { api } = useSubstrateState()
  const {
    state: { currentAccount },
  } = useSubstrate()

  const [userIdentity, setUserIdentity] = useState('')
  const [proposals, setProposals] = useState([])
  const [user, setUser] = useState()
  const [numVotes, setNumVotes] = useState(0)

  // Inputs
  const [newProposal, setNewProposal] = useState('')
  const [addIdentityAccount, setAddIdentityAccount] = useState('')
  const [addIdentityName, setAddIdentityName] = useState('')
  const [removeIdentityAccount, setRemoveIdentityAccount] = useState('')

  // The transaction submission status
  const [status, setStatus] = useState('')

  const getUserIdentity = async () => {
    if (currentAccount) {
      const identity = await api.query.identityVoting.identities(
        currentAccount.address
      )
      setUserIdentity(identity.isSome ? identity.unwrap().toHuman() : '')
    }
  }

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
        remainingTokens: userInfo.isSome ? userInfo.unwrap().toNumber() : 0,
        num_votes: userVotesInfo.isSome
          ? userVotesInfo.unwrap()[1].toNumber()
          : 0,
      }
      setUser(userData)
    }
  }

  const getAllInfo = () => {
    getUserIdentity()
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
          {status}
        </span>
      </h1>

      {/* USER */}
      {userIdentity ? (
        <div>USER IDENTITY: {userIdentity}</div>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            You need to identify in order to participate in the voting. Ask an
            ADMIN to do it.
          </div>
          {currentAccount?.address ===
            '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' && (
            <>
              <div style={{ marginBottom: 10 }}>
                Hi ADMIN! Here you can manage the identity of the accounts
              </div>
              <div style={{ marginBottom: 10 }}>
                <span style={{ marginRight: 10 }}>Set identity</span>
                <Input
                  label="Account"
                  state="addIdentityAccount"
                  type="text"
                  onChange={(_, { value }) => setAddIdentityAccount(value)}
                  style={{ marginRight: 10 }}
                />
                <Input
                  label="Name"
                  state="addIdentityName"
                  type="text"
                  onChange={(_, { value }) => setAddIdentityName(value)}
                  style={{ marginRight: 10 }}
                />
                <TxButton
                  label="Add"
                  type="SUDO-TX"
                  setStatus={setStatus}
                  color="green"
                  attrs={{
                    palletRpc: 'identityVoting',
                    callable: 'setIdentity',
                    inputParams: [
                      { type: 'AccountId32', value: addIdentityAccount },
                      { type: 'Bytes', value: addIdentityName },
                    ],
                    paramFields: [
                      { name: 'account', type: 'AccountId32', optional: false },
                      { name: 'name', type: 'Bytes', optional: false },
                    ],
                  }}
                />
              </div>
              <div>
                <span style={{ marginRight: 10 }}>Remove identity</span>
                <Input
                  label="Account"
                  state="removeIdentityAccount"
                  type="text"
                  onChange={(_, { value }) => setRemoveIdentityAccount(value)}
                  style={{ marginRight: 10 }}
                />
                <TxButton
                  label="Remove"
                  type="SUDO-TX"
                  setStatus={setStatus}
                  color="red"
                  attrs={{
                    palletRpc: 'identityVoting',
                    callable: 'removeIdentity',
                    inputParams: [
                      { type: 'AccountId32', value: removeIdentityAccount },
                    ],
                    paramFields: [
                      { name: 'account', type: 'AccountId32', optional: false },
                    ],
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      {userIdentity && user && !user.registered && (
        <div>
          <span style={{ marginRight: 10 }}>
            In order to participate, you need to REGISTER in this voting first
          </span>
          <TxButton
            label="Register"
            type="SIGNED-TX"
            setStatus={setStatus}
            attrs={{
              palletRpc: 'quadraticVoting',
              callable: 'register',
              inputParams: [],
              paramFields: [],
            }}
          />
        </div>
      )}

      {userIdentity && user && user.registered && (
        <>
          <div style={{ marginBottom: 10 }}>
            <span style={{ marginRight: 10 }}>
              You are registered in this voting
            </span>
            <TxButton
              label="Unregister"
              type="SIGNED-TX"
              setStatus={setStatus}
              attrs={{
                palletRpc: 'quadraticVoting',
                callable: 'unregister',
                inputParams: [],
                paramFields: [],
              }}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            USER REMAINING TOKENS: {user.remainingTokens}
          </div>
        </>
      )}

      <div
        style={{ borderTop: '3px solid #bbb', marginTop: 20, marginBottom: 20 }}
      />

      <div>
        {proposals.length ? (
          <>
            <div style={{ fontWeight: 900 }}>PROPOSAL: {proposals[0].name}</div>
            <div style={{ marginBottom: 10 }}>
              Total votes:{' '}
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

      {proposals.length > 0 && user && user.registered && (
        <>
          <div style={{ marginBottom: 10 }}>
            Your votes on this proposal: {Math.abs(user.num_votes)}{' '}
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
      <div
        style={{ borderTop: '3px solid #bbb', marginTop: 20, marginBottom: 20 }}
      />
    </Grid.Column>
  )
}

export default function QuadraticVoting(props) {
  const { api } = useSubstrateState()
  return api.query.quadraticVoting && api.query.quadraticVoting.proposals ? (
    <Main {...props} />
  ) : null
}
