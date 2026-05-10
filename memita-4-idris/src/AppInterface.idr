module AppInterface

import Data.MSet
import Data.MMap

import Data.AccountId

public export
data AddAccountError = AccountAlreadyExists

public export
data RemoveAccountError = AccountNotFound

public export
data AddContactError = AddContactAccountNotFound | ContactAlreadyExists

public export
data RemoveContactError = RemoveContactAccountNotFound | ContactNotFound

public export
interface UserMutation (r : Type -> Type) where
  addAccount : (accountSecret: AccountSecret) -> r (Either AddAccountError AccountId)
  removeAccount : (accountId: AccountId) -> r (Either RemoveAccountError ())
  addContact : (accountId: AccountId) -> (contactId: AccountId) -> r (Either AddContactError ())
  removeContact : (accountId: AccountId) -> (contactId: AccountId) -> r (Either RemoveContactError ())

public export
interface UserQuery (r : Type -> Type) where
  allAccounts : r (MSet AccountId)
  allContacts : AccountId -> r (Either String (MSet AccountId))