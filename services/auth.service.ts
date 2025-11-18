import { supabase } from "../lib/supabase";

// Tipos para as funções de autenticação
export interface SignUpData {
  email: string;
  password: string;
  nome?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

/**
 * Serviço de autenticação usando Supabase
 */
export const authService = {
  /**
   * Cadastra um novo usuário no Supabase
   * @param data - Dados do cadastro (email, senha e nome opcional)
   * @returns Promise com o resultado do cadastro
   */
  signUp: async (data: SignUpData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome: data.nome, // Metadados adicionais do usuário
          },
        },
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao cadastrar usuário",
      };
    }
  },

  /**
   * Faz login de um usuário existente
   * @param data - Dados de login (email e senha)
   * @returns Promise com o resultado do login
   */
  async signIn(data: SignInData) {
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: authData.user,
        session: authData.session,
      };
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Envia email de recuperação de senha
   * @param data - Email do usuário
   * @returns Promise com o resultado do envio
   */
  async forgotPassword(data: ForgotPasswordData) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        // URL de redirecionamento após resetar a senha
        // Você pode configurar isso no Supabase Dashboard ou usar uma rota do app
        redirectTo: `${
          process.env.EXPO_PUBLIC_APP_URL || "app-oficinas://"
        }/(auth)/reset-password`,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Email de recuperação enviado com sucesso",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao enviar email de recuperação",
      };
    }
  },

  /**
   * Faz logout do usuário atual
   * @returns Promise com o resultado do logout
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Logout realizado com sucesso",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao fazer logout",
      };
    }
  },

  /**
   * Obtém a sessão atual do usuário
   * @returns Promise com a sessão atual ou null
   */
  async getCurrentSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return {
        success: true,
        session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao obter sessão",
        session: null,
      };
    }
  },

  /**
   * Obtém o usuário atual
   * @returns Promise com o usuário atual ou null
   */
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return {
        success: true,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao obter usuário",
        user: null,
      };
    }
  },
};
