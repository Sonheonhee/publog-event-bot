module.exports = {
    apps: [
        {
            name: 'nextjs-server',
            script: 'node_modules/next/dist/bin/next',
            args: 'start',
            env: {
                NODE_ENV: 'production',
                PORT: 3000,
            },
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
        },
        {
            name: 'stock-monitor',
            script: './scripts/monitor.js',
            env: {
                NODE_ENV: 'production',
            },
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            restart_delay: 5000,
        },
    ],
};
