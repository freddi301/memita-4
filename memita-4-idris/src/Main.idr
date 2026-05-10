module Main

import Data.MSet
import Data.MMap

import Data.AccountId
import AppInterface
import State

main : IO ()
main = putStrLn "Hello from Idris2!"

record AccountEntry where
  constructor MkAccountEntry
  secret : AccountSecret
  contacts : MSet AccountId

record SimpleSystem where
  constructor MkSimpleSystem
  accounts : MMap AccountId AccountEntry

UserQuery (\a => SimpleSystem -> a) where
  allAccounts sys = keys sys.accounts
  allContacts accountId sys =
    case get accountId sys.accounts of
      Nothing => Left "Account not found"
      Just accountEntry => Right $ accountEntry.contacts

UserMutation (State SimpleSystem) where

  addAccount accountSecret = do
    let accountId = from accountSecret
    Nothing <- readin $ get accountId . accounts
      | _ => return $ Left AccountAlreadyExists
    modify $ { accounts $= set accountId (MkAccountEntry accountSecret empty) }
    return $ Right accountId

  removeAccount accountId = do
    Just _ <- readin $ get accountId . accounts
      | _ => return $ Left AccountNotFound
    modify $ { accounts $= rem accountId }
    return $ Right ()

  addContact accountId contactId = do
    Just accountEntry <- readin $ get accountId . accounts
      | _ => return $ Left AddContactAccountNotFound
    let False = has contactId accountEntry.contacts
      | _ => return $ Left ContactAlreadyExists
    modify $ { accounts $= set accountId ({ contacts $= add contactId } accountEntry) }
    return $ Right ()

  removeContact accountId contactId = do
    Just accountEntry <- readin $ get accountId . accounts
      | _ => return $ Left RemoveContactAccountNotFound
    let True = has contactId accountEntry.contacts
      | _ => return $ Left ContactNotFound
    modify $ { accounts $= set accountId ({ contacts $= rem contactId } accountEntry) }
    return $ Right ()

-- async mutation
-- async query
-- subscriptions over wire
-- persist
-- performance
-- embed typescript api
-- hyperswarm driver