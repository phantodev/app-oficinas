#!/bin/bash
# Script para remover a chave OpenAI do commit bf0b00d

# Primeiro, vamos fazer checkout do commit problemático
git checkout bf0b00d -- app.json

# Remove a linha com openaiApiKey
sed -i '/openaiApiKey/d' app.json

# Adiciona ao stage
git add app.json

# Faz commit da correção
git commit --amend --no-edit

# Volta para o branch master
git checkout master

