import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Programacao } from '../types/programacao';

export interface SubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
}

export const useSupabaseSubscription = (
  options: SubscriptionOptions,
  callback: (payload: unknown) => void,
  dependencies: unknown[] = []
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Limpar subscription anterior se existir
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Criar nova subscription
    const channel = supabase
      .channel(`${options.table}_changes`)
      .on(
        'postgres_changes',
        {
          event: options.event || '*',
          schema: options.schema || 'public',
          table: options.table,
        },
        (payload) => {
          console.log(`Subscription update for ${options.table}:`, payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`Subscription status for ${options.table}:`, status);
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, dependencies);

  // Função para limpar manualmente
  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  return { unsubscribe };
};

// Hook específico para programações
export const useProgramacaoSubscription = (
  callback: (programacao: Programacao, event: 'INSERT' | 'UPDATE' | 'DELETE') => void
) => {
  return useSupabaseSubscription(
    {
      table: 'programacao',
      event: '*',
    },
    (payload) => {
      const event = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
      const programacao = event === 'DELETE' ? payload.old : payload.new;
      callback(programacao, event);
    }
  );
};

// Hook para múltiplas tabelas
export const useMultiTableSubscription = (
  tables: string[],
  callback: (payload: unknown, table: string) => void
) => {
  const channelsRef = useRef<RealtimeChannel[]>([]);

  useEffect(() => {
    // Limpar subscriptions anteriores
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Criar subscriptions para cada tabela
    const channels = tables.map(table => {
      const channel = supabase
        .channel(`${table}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
          },
          (payload) => {
            callback(payload, table);
          }
        )
        .subscribe();

      return channel;
    });

    channelsRef.current = channels;

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [tables.join(',')]);

  const unsubscribe = () => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];
  };

  return { unsubscribe };
};




