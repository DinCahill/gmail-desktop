import React from 'react'
import {
  Container,
  Input,
  Flex,
  Heading,
  Button,
  FormControl,
  FormLabel
} from '@chakra-ui/react'
import { nanoid } from 'nanoid'
import { Except } from 'type-fest'
import { Account } from '../../types'

interface AddAccountProps {
  onAdd: (account: Except<Account, 'selected'>) => void
  onCancel: () => void
}

function AddAccount({ onAdd, onCancel }: AddAccountProps) {
  const [account, setAccount] = React.useState({ id: nanoid(), label: '' })
  const { id, label } = account

  const isLabelRequired = label.length === 0

  const addAccount = () => {
    if (label) {
      onAdd({ id, label })
    }
  }

  return (
    <Container>
      <Heading mb="8">Add Account</Heading>
      <FormControl mb="8" isRequired>
        <FormLabel htmlFor="label">Label</FormLabel>
        <Input
          id="label"
          placeholder="Work, me@work.com, ..."
          value={label}
          onKeyPress={(event) => {
            if (event.key === 'Enter') {
              addAccount()
            }
          }}
          onChange={(event) => {
            setAccount({ id, label: event.target.value })
          }}
          isInvalid={isLabelRequired}
          autoFocus
        />
      </FormControl>
      <Flex justifyContent="flex-end">
        <Button
          mr="2"
          onClick={() => {
            onCancel()
          }}
        >
          Cancel
        </Button>
        <Button
          colorScheme="blue"
          onClick={() => {
            addAccount()
          }}
          disabled={isLabelRequired}
        >
          Add
        </Button>
      </Flex>
    </Container>
  )
}

export default AddAccount
