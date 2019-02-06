### serverless env vars
```bash
# env.json
{
  "MONGO_URI": "mongodb://<user>:<pass>@127.0.0.1:27017/db",
  "APP_ORIGIN": "Optionl restrict to client DNS"
}
```
### setup scripts env
```bash
# setup.env
MONGO_URI='mongodb://<root>:<root-pass>@127.0.0.1:27017/admin'
DB_NAME='Name of Database to create. Defaults to "db"'
API_USER='Username of serverless user, with admin privs to DB_NAME. Defaults to "api"'
API_PASSWORD='Any string. A randomly generated password will be created if omitted.'
```
