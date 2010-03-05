
ЭТО ЭКСПЕРИМЕНТАЛЬНОЕ РАСШИРЕНИЕ, AS IS
Я не несу ответственность за порчу ваших данных 

Данное расширение сделано для исследования возможности сохранения адресной книги на ldap сервере.

Работоспособность проверялась на 389 directory server (далее: 389ds).

Возможности:
    Синхронизирует выбранную адресную книгу. Если карточка отсутствует на сервере то создает ее там, если уже имеется модифицирует имеющуюся.
    PrimaryEmail и SecondEmail сохраняются в атрибут mail.
    На серверах OpenLdap и 389ds используется схема COSINE LDAP/X.500 Schema (rfc4524), где для атрибута mail по умолчанию можно использовать множество значений (в ms AD только одно) 
    Загружает фото пользователя из карточки в атрибут jpegPhoto и обратно из атрибута в карточку.


How to install:
   1 create or select existing address card book
   2 Menu Tools/LdapRW Preferences
     2.1 Address Book: name of selected book
     2.2 Uri such as^ ldap://server.local/ou=addressbook,dc=local??sub?(objectclass=*)
     2.3 Auth DN: uid=ilnur,ou=people,dc=local
     2.4 Attribute RDN for new new ldap card: cn or uid
     2.5 Object Classes for new ldap card: inetorgperson, mozillaAbPersonAlpha, organizationalPerson,person
     2.6 maxHits: 100

How to use

New ldap card
   1 Create new contact card in selected book
   2 Menu Tools/LdapRW Sync. Add to ldap server.
Sync
   1 Menu Tools/LdapRW Sync.

Load from ldap server to book.
   1. From ldap cards explorer select configured ldap server
   2. Enter search string
   3. Select cards from tree
   4. Push button "Add to book" add cards to current selected book.

Delete cards in ldap server
   1. From ldap cards explorer select configured ldap server
   2. Enter search string
   3. Select cards from tree
   4. Push button "Del" del cards

