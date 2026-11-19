// Terminal demo challenge room data (Room 90 - Part C)
window.SEED = (window.SEED || []).concat([
  {
    id: 90,
    title: 'Terminal Lab Demo',
    cat: 'Cisco IOS CLI',
    diff: 'Easy',
    min: 15,
    desc: 'Interactive hands-on Cisco IOS command line simulation challenges.',
    qs: [
      {
        id: 0,
        type: 'terminal',
        q: 'Enter privileged EXEC mode and display the IP routing table.',
        expect: ['enable', 'show ip route'],
        pts: 10,
        explain: 'Use "enable" to enter privileged EXEC mode (#), then "show ip route" to view the routing table.'
      },
      {
        id: 1,
        type: 'terminal',
        q: 'Enter global configuration mode and configure the router hostname to R1.',
        expect: ['enable', 'configure terminal', 'hostname R1'],
        pts: 10,
        explain: 'From privileged mode, enter "configure terminal" to access global configuration, then run "hostname R1".'
      },
      {
        id: 2,
        type: 'terminal',
        q: 'Navigate to interface GigabitEthernet0/0, configure IP address 192.168.1.1 255.255.255.0, and enable the interface.',
        expect: ['enable', 'configure terminal', 'interface g0/0', 'ip address 192.168.1.1 255.255.255.0', 'no shutdown'],
        pts: 10,
        explain: 'Enter interface configuration with "interface g0/0", assign the address with "ip address 192.168.1.1 255.255.255.0", and bring it up with "no shutdown".'
      }
    ]
  }
]);
