# nitya.connect

A minimal CLI utility to interact with the **Nitya Sponsor Server**, allowing developers to securely manage Arweave wallets, initialize deployments, and request sponsor credits for event-based pools.

---

## ✨ Installation

```bash
npm install -g nitya.connect
```

This will install the following global CLI commands:

* `nityabegin`
* `nityafuel`

---

## 🛠 Commands

### 🔁 `nityabegin`

Initialize or inspect your local project wallet.

#### Generate a wallet

```bash
nityabegin --projectname <project>
```

Creates a new Arweave wallet for the given project in:

```
~/.permaweb/<project>/wallet.json
```

#### View wallet address

```bash
nityabegin --wallet-address
```

Prints the address of your most recently created wallet.

#### Link a project to an event pool

```bash
nityabegin --event <eventPoolId>
```

Creates a `perma-config.json` in your working directory:

```json
{
  "walletAddress": "arweave-address",
  "eventPoolId": "pool-id",
  "walletPath": "/home/user/.permaweb/<project>/wallet.json"
}
```

---

### ⚡ `nityafuel`

Request deploy credits from an event-based sponsor pool.

#### Request credits

```bash
nityafuel --projectname <project>
```

Looks for:

* The wallet at `~/.permaweb/<project>/wallet.json`
* A local `perma-config.json`

Signs the pool ID and submits it to the sponsor server:

```bash
POST http://167.86.105.114/share-credits
```

Success response:

```json
{
  "message": "Credits shared successfully",
  "txId": "arweave-tx-id",
  "amount": "1000000000000"
}
```

---

## 📂 File Layout

```
~/.permaweb/
  └── <project>/
        └── wallet.json

./perma-config.json   # Linked config
```

---

## 🔐 Security Notes

* Wallets are **never uploaded**; signatures happen locally.
* Wallet keyfiles live in `~/.permaweb/`.
* This CLI is **offline-safe** and respects user privacy.

---

## 🔧 Server Compatibility

Must be used with a compatible Nitya Sponsor Server exposing:

* `POST /share-credits`
* Signature verification for event pools

---

## 📄 License

Licensed under the **GNU Affero General Public License v3.0**.
See the `LICENSE` file for full terms.
