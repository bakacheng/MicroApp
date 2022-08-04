import fs from 'fs'
import { transformFileSync } from '@babel/core'
import liveServer from 'live-server'

let result = transformFileSync('./src/index.js', {presets:[['@babel/preset-react',{pragma: 'createElement'}]
]})
fs.writeFileSync('./obj/index.js',result.code)
liveServer.start({})