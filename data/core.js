// Core CCNA Challenge Labs seed rooms (IDs 1-21)
window.SEED = (window.SEED || []).concat([
  {
    id: 1,
    title: "Network Foundations",
    cat: "Fundamentals",
    diff: "Easy",
    min: 15,
    desc: "Map any packet onto the right OSI layer and name the device that moves it.",
    qs: [
      { id: 0, q: "Which OSI layer does a router operate at? (number)", a: "3;layer 3;network" },
      { id: 1, q: "Which OSI layer handles framing and MAC addressing? (number)", a: "2;layer 2;data link" },
      { id: 2, q: "What is the PDU name at Layer 4 for TCP?", a: "segment" },
      { id: 3, q: "Which device forwards frames based on MAC addresses?", a: "switch" },
      { id: 4, q: "Which OSI layer is called Presentation? (number)", a: "6;layer 6" }
    ]
  },
  {
    id: 2,
    title: "Cabling & Ethernet",
    cat: "Fundamentals",
    diff: "Easy",
    min: 15,
    desc: "Cable lengths, connectors and standards - the physical layer facts every CCNA exam expects.",
    qs: [
      { id: 0, q: "Max length in metres of a UTP Ethernet segment?", a: "100" },
      { id: 1, q: "Which cable type connects two switches on legacy gear: straight-through or crossover?", a: "crossover" },
      { id: 2, q: "Which connector does UTP Ethernet use?", a: "rj45;rj-45" },
      { id: 3, q: "IEEE standard for Gigabit Ethernet over copper?", a: "802.3ab" }
    ]
  },
  {
    id: 3,
    title: "Network Devices & Topologies",
    cat: "Fundamentals",
    diff: "Easy",
    min: 15,
    desc: "Routers, switches, firewalls and the wireless LAN types they connect.",
    qs: [
      { id: 0, q: "Which table does a router consult to forward a packet?", a: "routing table" },
      { id: 1, q: "A switch stores learned MAC addresses in which table?", a: "cam;cam table;mac table;mac address table" },
      { id: 2, q: "Which firewall type tracks the state of connections?", a: "stateful" },
      { id: 3, q: "Which WLAN type needs no access point, clients talk directly?", a: "ad hoc;adhoc;ibss" }
    ]
  },
  {
    id: 4,
    title: "TCP, UDP & Transport",
    cat: "Fundamentals",
    diff: "Easy",
    min: 15,
    desc: "How the transport layer sets up, numbers and delivers data.",
    qs: [
      { id: 0, q: "Which message completes the TCP three-way handshake?", a: "ack" },
      { id: 1, q: "Which transport protocol is connectionless?", a: "udp" },
      { id: 2, q: "Default TCP port of HTTPS?", a: "443" },
      { id: 3, q: "Which transport protocol uses sequence numbers to guarantee order?", a: "tcp" }
    ]
  },
  {
    id: 5,
    title: "Discovery Protocols & PoE",
    cat: "Fundamentals",
    diff: "Easy",
    min: 15,
    desc: "CDP, LLDP and powering devices over the cable.",
    qs: [
      { id: 0, q: "Command that lists CDP neighbors?", a: "show cdp neighbors" },
      { id: 1, q: "Which discovery protocol is vendor-neutral (IEEE 802.1AB)?", a: "lldp" },
      { id: 2, q: "In PoE, the device that supplies power is the ___ (3-letter abbreviation)?", a: "pse" },
      { id: 3, q: "An IP phone drawing power over Ethernet is a ___ (2-letter abbreviation)?", a: "pd" }
    ]
  },
  {
    id: 6,
    title: "Switching & ARP",
    cat: "Switching",
    diff: "Medium",
    min: 20,
    desc: "Follow a frame host to host: MAC learning, ARP resolution, flooding and loop prevention.",
    qs: [
      { id: 0, q: "What does a switch do with a frame to an unknown unicast MAC?", a: "flood;flooding" },
      { id: 1, q: "Which protocol maps an IP address to a MAC address?", a: "arp" },
      { id: 2, q: "Destination MAC of an ARP request?", a: "ff:ff:ff:ff:ff:ff" },
      { id: 3, q: "Which protocol prevents Layer 2 loops?", a: "stp;spanning tree" }
    ]
  },
  {
    id: 7,
    title: "IPv4 Addressing & Subnetting",
    cat: "Addressing",
    diff: "Medium",
    min: 25,
    desc: "Derive network, broadcast and usable ranges from a prefix - the core CCNA maths.",
    qs: [
      { id: 0, q: "Dotted-decimal mask for /26?", a: "255.255.255.192" },
      { id: 1, q: "Usable hosts in a /27?", a: "30" },
      { id: 2, q: "Network address of 192.168.10.77/26?", a: "192.168.10.64" },
      { id: 3, q: "Broadcast address of 10.1.1.0/24?", a: "10.1.1.255" }
    ]
  },
  {
    id: 8,
    title: "Subnetting Lab - VLSM Design",
    cat: "Addressing",
    diff: "Medium",
    min: 25,
    desc: "Carve a block into right-sized subnets without wasting addresses.",
    qs: [
      { id: 0, q: "In VLSM, allocate the largest or smallest subnet first?", a: "largest" },
      { id: 1, q: "Prefix length needed for 50 hosts?", a: "/26;26" },
      { id: 2, q: "Typical prefix for a point-to-point link?", a: "/30;30" }
    ]
  },
  {
    id: 9,
    title: "DHCP, DNS & Network Services",
    cat: "Services",
    diff: "Medium",
    min: 20,
    desc: "Addressing hosts automatically and resolving names.",
    qs: [
      { id: 0, q: "First message a DHCP client sends?", a: "discover;dhcpdiscover" },
      { id: 1, q: "UDP port the DHCP server listens on?", a: "67" },
      { id: 2, q: "At what fraction of the lease does the client first try to renew?", a: "1/2;half;50%" },
      { id: 3, q: "Which protocol resolves hostnames to IP addresses?", a: "dns" }
    ]
  },
  {
    id: 10,
    title: "VLANs & Trunking",
    cat: "Switching",
    diff: "Medium",
    min: 20,
    desc: "Segment broadcast domains and carry VLANs between switches.",
    qs: [
      { id: 0, q: "Command to put an access port in VLAN 20?", a: "switchport access vlan 20" },
      { id: 1, q: "DTP mode that actively tries to form a trunk?", a: "dynamic desirable;desirable" },
      { id: 2, q: "Which VLAN carries untagged frames on an 802.1Q trunk?", a: "native vlan;native" },
      { id: 3, q: "What Layer 2 feature splits broadcast domains on a switch?", a: "vlan;vlans" }
    ]
  },
  {
    id: 11,
    title: "Wireless Fundamentals",
    cat: "Wireless",
    diff: "Medium",
    min: 20,
    desc: "Channels, controllers and Wi-Fi security generations.",
    qs: [
      { id: 0, q: "Non-overlapping 2.4 GHz channels in the US?", a: "1,6,11;1 6 11" },
      { id: 1, q: "Protocol a WLC uses to control lightweight APs?", a: "capwap" },
      { id: 2, q: "Bit size of the WPA3-Enterprise 192-bit suite?", a: "192" },
      { id: 3, q: "QAM level used by 802.11ax?", a: "1024;1024-qam" }
    ]
  },
  {
    id: 12,
    title: "IPv6 Fundamentals",
    cat: "Addressing",
    diff: "Hard",
    min: 25,
    desc: "Address formats, shortening rules and the prefixes that matter.",
    qs: [
      { id: 0, q: "How many bits is an IPv6 address?", a: "128" },
      { id: 1, q: "Shortest form of 2001:0db8:0000:0000:0000:0000:0000:0001?", a: "2001:db8::1" },
      { id: 2, q: "Link-local prefix?", a: "fe80::/10;fe80::" }
    ]
  },
  {
    id: 13,
    title: "Routing Fundamentals",
    cat: "Routing",
    diff: "Hard",
    min: 25,
    desc: "Longest match, administrative distance and the commands that prove a route is installed.",
    qs: [
      { id: 0, q: "Default AD of OSPF?", a: "110" },
      { id: 1, q: "Default AD of a static route?", a: "1" },
      { id: 2, q: "Command to display the routing table?", a: "show ip route" },
      { id: 3, q: "Which rule picks between overlapping routes?", a: "longest prefix match;longest match" }
    ]
  },
  {
    id: 14,
    title: "Spanning Tree & EtherChannel",
    cat: "Switching",
    diff: "Hard",
    min: 25,
    desc: "Root election, rapid convergence and bundling links.",
    qs: [
      { id: 0, q: "The root bridge has the lowest what?", a: "bridge id;bid" },
      { id: 1, q: "IEEE standard number for RSTP?", a: "802.1w" },
      { id: 2, q: "Which EtherChannel protocol is the IEEE standard?", a: "lacp" },
      { id: 3, q: "Maximum active links in one EtherChannel?", a: "8" }
    ]
  },
  {
    id: 15,
    title: "OSPF & Dynamic Routing",
    cat: "Routing",
    diff: "Hard",
    min: 25,
    desc: "Neighbours, DR election and link-state basics.",
    qs: [
      { id: 0, q: "Multicast address for OSPF hellos?", a: "224.0.0.5" },
      { id: 1, q: "Which LSA type is the Router LSA?", a: "1;type 1;lsa 1" },
      { id: 2, q: "Which algorithm does OSPF run?", a: "dijkstra;spf" },
      { id: 3, q: "DR election prefers the highest what first?", a: "priority;ospf priority" }
    ]
  },
  {
    id: 16,
    title: "First Hop Redundancy",
    cat: "Routing",
    diff: "Hard",
    min: 20,
    desc: "HSRP, VRRP and GLBP keeping the default gateway alive.",
    qs: [
      { id: 0, q: "Default HSRP priority?", a: "100" },
      { id: 1, q: "Which FHRP load-balances using multiple virtual MACs?", a: "glbp" },
      { id: 2, q: "Which FHRP is an open standard?", a: "vrrp" },
      { id: 3, q: "The HSRP router currently forwarding traffic is the ___ router?", a: "active" }
    ]
  },
  {
    id: 17,
    title: "Network Management & QoS",
    cat: "Services",
    diff: "Hard",
    min: 25,
    desc: "SNMP, Syslog, NTP and traffic marking.",
    qs: [
      { id: 0, q: "Unsolicited notification an SNMP agent sends?", a: "trap" },
      { id: 1, q: "Command to view the local syslog buffer?", a: "show logging" },
      { id: 2, q: "Highest believable NTP stratum?", a: "15" },
      { id: 3, q: "Decimal DSCP value of EF (binary 101110)?", a: "46" }
    ]
  },
  {
    id: 18,
    title: "VLANs, Trunks & STP",
    cat: "Switching",
    diff: "Expert",
    min: 30,
    desc: "Trunk tagging, native VLANs, root bridge election and the commands that reveal them.",
    qs: [
      { id: 0, q: "Trunk tagging standard?", a: "802.1q" },
      { id: 1, q: "Default native VLAN?", a: "1" },
      { id: 2, q: "Command to list trunk ports?", a: "show interfaces trunk;show interface trunk" },
      { id: 3, q: "Root bridge is elected by the lowest what?", a: "bridge id;bid;bridge priority" }
    ]
  },
  {
    id: 19,
    title: "Security, ACLs & NAT",
    cat: "Security",
    diff: "Expert",
    min: 30,
    desc: "Wildcard logic, implicit denies and NAT translations at the edge of the network.",
    qs: [
      { id: 0, q: "Wildcard mask equivalent to /24?", a: "0.0.0.255" },
      { id: 1, q: "What implicit rule ends every ACL?", a: "deny any;implicit deny;deny" },
      { id: 2, q: "NAT many-to-one using ports is called?", a: "pat;nat overload;overload" },
      { id: 3, q: "Standard numbered ACL range?", a: "1-99" }
    ]
  },
  {
    id: 20,
    title: "Layer 2 Attacks & Port Security",
    cat: "Security",
    diff: "Expert",
    min: 30,
    desc: "Defend the access layer against spoofing and flooding.",
    qs: [
      { id: 0, q: "Default port-security violation mode?", a: "shutdown" },
      { id: 1, q: "Keyword that learns MACs and saves them in the running config?", a: "sticky" },
      { id: 2, q: "Attack that fills the CAM table with spoofed MACs?", a: "mac flooding;cam table overflow;cam overflow;mac flood" },
      { id: 3, q: "Feature that blocks rogue DHCP servers?", a: "dhcp snooping" }
    ]
  },
  {
    id: 21,
    title: "SDN, Automation & WAN",
    cat: "Automation",
    diff: "Expert",
    min: 30,
    desc: "Controllers, REST, configuration management and MPLS.",
    qs: [
      { id: 0, q: "REST verb that creates a new resource?", a: "post" },
      { id: 1, q: "Ansible name for an ordered list of tasks?", a: "playbook;playbooks" },
      { id: 2, q: "Which plane forwards traffic from ingress to egress?", a: "data plane;data;forwarding plane" },
      { id: 3, q: "MPLS forwards using which inserted header?", a: "label;shim;shim header;mpls label" }
    ]
  }
]);
