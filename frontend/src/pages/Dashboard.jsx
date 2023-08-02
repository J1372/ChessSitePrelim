import React from "react";
import { Outlet, useLoaderData } from "react-router-dom";
import { SessionUserContext } from "../contexts/SessionUserContext";
import { SiteHeader } from '../components/SiteHeader'

export const dashboardLoader = async () => {
    return fetch('/username')
        .then(res => res.text());
}

export default function Dashboard() {
    const sessionUser = useLoaderData();

    return (
          <SessionUserContext.Provider value={sessionUser}>
            <SiteHeader/>
            <Outlet />
            <footer id="site-footer" className="section">
              <p>Links:</p>
              <address>
                <a className="button" href="https://github.com/J1372">Github</a>
              </address>
            </footer>
          </SessionUserContext.Provider>
    )
}