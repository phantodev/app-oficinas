#!/bin/bash
# Script para fazer rebase interativo e remover a chave do commit bf0b00d

# Configura o editor para não ser interativo
export GIT_SEQUENCE_EDITOR="sed -i '2s/^pick/edit/'"

# Faz o rebase começando do commit anterior ao problemático
git rebase -i 5f3ff0e

# Quando parar no commit bf0b00d, remove a chave
if [ -f app.json ]; then
    # Remove a linha com openaiApiKey
    sed -i '/openaiApiKey/d' app.json
    # Remove também a vírgula da linha anterior se necessário
    sed -i 's/,$//' app.json
    sed -i '/^[[:space:]]*$/d' app.json
    
    # Adiciona e continua o rebase
    git add app.json
    git commit --amend --no-edit
    git rebase --continue
fi

