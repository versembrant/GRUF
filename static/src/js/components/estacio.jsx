import React from 'react';
import { getCurrentSession } from "../sessionManager";

export const Estacio = ({nomEstacio}) => {
    return (
        <div className="estacio">
           {getCurrentSession().getEstacio(nomEstacio).getUserInterface()}
        </div>
    )
};