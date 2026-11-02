# To change this license header, choose License Headers in Project Properties.
# To change this template file, choose Tools | Templates
# and open the template in the editor.

FROM jboss/wildfly:18.0.1.Final

COPY ./target/planilla.war /opt/jboss/wildfly/standalone/deployments/
RUN /opt/jboss/wildfly/bin/add-user.sh admin Admin#123 --silent

# JBoss ports
EXPOSE 8080 9990 8009

CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0","-c", "standalone-ha.xml"]

#RUN /bin/bash -c "echo '#!/bin/bash' > /tmp/jboss.sh"
# IPADDRESS
#RUN /bin/bash -c "echo 'IPADDRESS=\$(hostname -i)' >> /tmp/jboss.sh"
#RUN /bin/bash -c "echo 'echo \"IPADDRESS=\$IPADDRESS\"' >> /tmp/jboss.sh"
# MODIFY standalone-ha.xml
#RUN /bin/bash -c "echo $'/opt/jboss/wildfly/bin/jboss-cli.sh <<EOF \n\
#embed-server --std-out=echo --server-config=standalone-ha.xml \n\
#/interface=multicast:add(inet-address=\$IPADDRESS) \n\
#/socket-binding-group=standard-sockets/socket-binding=jgroups-mping:write-attribute(name=interface, value=multicast) \n\
#/socket-binding-group=standard-sockets/socket-binding=jgroups-tcp:write-attribute(name=interface, value=multicast) \n\
#/socket-binding-group=standard-sockets/socket-binding=jgroups-udp:write-attribute(name=interface, value=multicast) \n\
#quit \n\
#EOF\n'\
#>> /tmp/jboss.sh"

#RUN /bin/bash -c "echo \"/opt/jboss/wildfly/bin/standalone.sh -b 0.0.0.0 -bmanagement 0.0.0.0 -server-config=standalone-ha.xml\" >> /tmp/jboss.sh"
#RUN /bin/bash -c "chmod +x /tmp/jboss.sh"

# START WILDFLY
#CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "0.0.0.0", "-bmanagement", "0.0.0.0", "-server-config=standalone-ha.xml"]
#CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "192.168.0.101", "-c", "standalone-ha.xml","-bmanagement", "192.168.0.101"]
#CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "192.168.0.102", "-c", "standalone-ha.xml", "-bmanagement", "192.168.0.102"]
#CMD ["/opt/jboss/wildfly/bin/standalone.sh", "-b", "192.168.0.108", "-c", "standalone-ha.xml", "-bmanagement", "192.168.0.108"]