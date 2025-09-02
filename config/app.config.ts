


export const EnvConfiguration = () => ({

    environment: process.env.NODE_ENV || 'dev',
    // mongodb: process.env.MONGODB,
    port: parseInt(process.env.PORT || "8001"),
    destinyHost: process.env.DESTINY_HOST || "127.0.0.1",
    destinyPort: parseInt(process.env.DESTINY_PORT || "8010"),
    defaultLimit: parseInt(process.env.DEFAULT_LIMIT as string) || 50,

})

//DESTINY_PORT=8010 # 8020 o 8010
