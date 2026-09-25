import os

import uvicorn
import main

if __name__ == "__main__":
    uvicorn.run(
        'main:app', port=443, host='0.0.0.0', reload=True,
        ssl_keyfile=os.environ.get('SSL_KEYFILE', 'cert/privkey.pem'),
        ssl_certfile=os.environ.get('SSL_CERTFILE', 'cert/fullchain.pem'))
