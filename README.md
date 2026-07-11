🧹 AutoDelete - Plugin para Equicord

Plugin que apaga automaticamente suas mensagens com comando no chat.


📥 Instalação

cd src/userplugins
git clone https://github.com/cryloopz/autodelete.git
cd ../..
pnpm build
pnpm inject


🔑 Configurar Token (necessário uma vez)

Abra o console do Discord (Ctrl+Shift+I) e execute:

webpackChunkdiscord_app.push([], { 0: (e, t, i) => { 
    for (const key in i.c) {
        const mod = i.c[key]?.exports;
        if (mod?.getToken) {
            console.log("Token:", mod.getToken());
        }
    }
} })

Copie o token que aparecer e defina no plugin:

autoDelete.setToken("SEU_TOKEN_AQUI")

Para verificar se o token foi definido:

autoDelete.check()


🎯 Comandos no Chat

Comandos Principais

autodelete          - Mostra status atual
autodelete on       - Ativa o AutoDelete
autodelete off      - Desativa o AutoDelete
autodelete status   - Mostra status detalhado
autodelete list     - Lista mensagens agendadas
autodelete clear    - Cancela todas as mensagens agendadas
autodelete pause    - Pausa o AutoDelete
autodelete resume   - Retoma o AutoDelete

Comandos de Tempo (Segundos)

autodelete 1s  - 1 segundo
autodelete 5s  - 5 segundos
autodelete 10s - 10 segundos
autodelete 15s - 15 segundos
autodelete 20s - 20 segundos
autodelete 30s - 30 segundos
autodelete 45s - 45 segundos
autodelete 50s - 50 segundos
autodelete 55s - 55 segundos

Comandos de Tempo (Minutos)

autodelete 1m  - 1 minuto
autodelete 2m  - 2 minutos
autodelete 3m  - 3 minutos
autodelete 4m  - 4 minutos
autodelete 5m  - 5 minutos
autodelete 10m - 10 minutos
autodelete 15m - 15 minutos
autodelete 20m - 20 minutos
autodelete 30m - 30 minutos
autodelete 45m - 45 minutos
autodelete 60m - 1 hora (máximo)

Versões Curtas (AD)

ad          - autodelete
ad on       - autodelete on
ad off      - autodelete off
ad status   - autodelete status
ad list     - autodelete list
ad clear    - autodelete clear
ad pause    - autodelete pause
ad resume   - autodelete resume
ad 10s      - autodelete 10s
ad 1m       - autodelete 1m


🖥️ Comandos no Console

autoDelete.setToken("TOKEN")  - Define o token manualmente
autoDelete.check()            - Verifica se o token está definido
autoDelete.toggle()           - Liga/Desliga o AutoDelete
autoDelete.setDelay(10)       - Define o delay em segundos
autoDelete.status()           - Mostra o status atual
autoDelete.pause()            - Pausa o AutoDelete
autoDelete.resume()           - Retoma o AutoDelete


📋 Exemplos Práticos

autodelete 5s
autodelete on

autodelete 2m
autodelete on

autodelete status
autodelete list

autodelete pause
autodelete resume

autodelete clear

autodelete off

ad 10s
ad on
ad status
ad pause
ad resume
ad clear
ad off


⚠️ Limitações

- Só apaga suas próprias mensagens (não funciona em mensagens de outros)
- Mensagens com mais de 14 dias não podem ser apagadas (limitação do Discord)
- Delay mínimo: 1s (1 segundo)
- Delay máximo: 60m (1 hora)
- Não pede confirmação - a mensagem é apagada automaticamente


🛠️ Requisitos

- Equicord instalado
- Token do Discord (configurado uma única vez)
- Permissão para apagar suas próprias mensagens


👤 Autor

Feito por l1wn 🚀


📝 Notas

- Plugin criado para o Equicord (fork do Vencord)
- Compatível com as versões mais recentes do Discord
- Em caso de bugs, abra uma issue no repositório


Aproveite o AutoDelete! 🧹