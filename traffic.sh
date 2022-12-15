while true; 
    do sleep 0.2; 
    curl -X GET http://192.168.49.2:32339/health?name=Java&fake_error=true;
    echo "\n";
done

