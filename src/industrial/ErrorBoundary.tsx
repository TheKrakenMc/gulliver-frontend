import { Component } from 'react';
import type { PropsWithChildren } from 'react';
export default class ErrorBoundary extends Component<PropsWithChildren,{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() {
    if(this.state.failed) return <main className="industrial loading"><h1>No se pudo abrir esta vista</h1><p>Revisa la conexión y vuelve a cargar. Esta acción no borra los datos guardados del navegador.</p><button onClick={()=>window.location.reload()}>Volver a cargar</button></main>;
    return this.props.children;
  }
}
